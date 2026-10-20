#!/usr/bin/env python3
"""Inspect one explicit local catalog JSON snapshot; never connect or mutate."""

import argparse
import hashlib
import json
import math
import re
import sys
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import UUID

VERSION = "1.2"
MAX_BYTES = 32 * 1024 * 1024
LANGUAGES = ("en", "ua", "ru", "pt-BR", "pt-PT")
ENUMS = {
    "category": {"compound", "isolation"},
    "weight_type": {"free", "fixed", "body_weight"},
    "force_type": {"push", "pull", "hinge"},
    "experience": {"beginner", "intermediate", "advanced", "pro"},
    "muscles": set("pectoralis_major_clavicular pectoralis_major_sternocostal pectoralis_major_abdominal trapezius latissimus_dorsi rhomboids teres_major rectus_abdominis obliques calf gluteal hamstrings quadriceps adductors abductors anterior_deltoid lateral_deltoid posterior_deltoid biceps triceps forearm".split()),
    "muscle_groups": set("chest_muscles back_muscles abdominal_muscles legs arms_and_forearms shoulder_muscles".split()),
    "equipments": set("dumbbells barbell ez_bar v_bar trap_bar rope straight_bar cord_handles wide_grip_handle close_grip_handle ab_machines butterfly butterfly_reverse leg_extension_machines leg_curl_machines chest_press_machines biceps_machines smith_machines hack_squat_machines deadlift_machines shoulder_press_machines lateral_raise_machines triceps_machines calf_raise_machines glute_machines abductor_machine adductor_machine leg_press_machine lat_pulldown cable cable_crossover row_cable pull_up_bar dip_bars romain_chair glute_ham_raise_bench flat_bench adjustable_bench decline_bench flat_bench_with_rack incline_bench_with_rack decline_bench_with_rack squat_rack preacher_curl_bench row_bench".split()),
    "equipment_groups": set("free_weight machines cable_machines body_weight benches_and_racks".split()),
}
COMMON = ("id", "created_at", "updated_at")
FIELDS = {
    "exercise_examples": COMMON + ("name", "description", "image_url", "category", "weight_type", "force_type", "experience"),
    "exercise_example_bundles": COMMON + ("exercise_example_id", "muscle_id", "percentage"),
    "exercise_examples_equipments": COMMON + ("exercise_example_id", "equipment_id"),
    "exercise_example_components": COMMON + ("exercise_example_id", "external_weight_required", "body_weight_multiplier", "extra_weight_required", "assist_weight_required"),
    "exercise_example_translations": COMMON + ("exercise_example_id", "language", "name", "description"),
    "muscles": COMMON + ("name", "type", "muscle_group_id", "recovery", "size", "sensitivity"),
    "muscle_groups": COMMON + ("name", "type"),
    "equipments": COMMON + ("name", "type", "equipment_group_id"),
    "equipment_groups": COMMON + ("name", "type"),
}
FKS = {
    "exercise_example_bundles": (("exercise_example_id", "exercise_examples"), ("muscle_id", "muscles")),
    "exercise_examples_equipments": (("exercise_example_id", "exercise_examples"), ("equipment_id", "equipments")),
    "exercise_example_components": (("exercise_example_id", "exercise_examples"),),
    "exercise_example_translations": (("exercise_example_id", "exercise_examples"),),
    "muscles": (("muscle_group_id", "muscle_groups"),),
    "equipments": (("equipment_group_id", "equipment_groups"),),
}
PLACEHOLDER = re.compile(r"^(todo|tbd|undefined|null|lorem ipsum)(?:\b|$)", re.IGNORECASE)
DECIMAL_TEXT = re.compile(r"[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?\Z")
NULLABLE_GROUP_FKS = {("muscles", "muscle_group_id"), ("equipments", "equipment_group_id")}


class InvalidInput(Exception):
    pass


class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise InvalidInput("arguments_invalid")


def canonical_uuid(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = UUID(value)
    except ValueError:
        return None
    return str(parsed) if str(parsed) == value.lower() else None


def decimal_number(value):
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        return None
    text = str(value).strip(" \t\n\r\v\f")
    # Decimal alone accepts underscores and Unicode digits that JS Number rejects.
    if not DECIMAL_TEXT.fullmatch(text):
        return None
    try:
        result = Decimal(text)
        consumer_finite = math.isfinite(float(text))
    except (InvalidOperation, OverflowError, ValueError):
        return None
    return result if result.is_finite() and consumer_finite else None


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise InvalidInput("json_duplicate_key")
        result[key] = value
    return result


def forbidden_constant(value):
    raise InvalidInput("json_nonfinite_number")


def finite_json_float(value):
    result = float(value)
    if not math.isfinite(result):
        raise InvalidInput("json_nonfinite_number")
    return result


def integral_json_number(value):
    # JS JSON.parse / Number.isInteger accept 100.0, but not booleans or strings.
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value) and (type(value) is int or value.is_integer())
    except OverflowError:
        return False


def valid_percentage(value):
    return integral_json_number(value) and 0 <= value <= 100


class Inspector:
    def __init__(self, tables):
        self.tables = tables
        self.diagnostics = []
        self.ids = {table: {canonical_uuid(row.get("id")) for row in rows} - {None}
                    for table, rows in tables.items()}

    def emit(self, severity, code, table=None, row=None, index=None, field=None, count=None):
        item = {"severity": severity, "code": code}
        if table is not None:
            item["table"] = table
        if index is not None:
            item["row_index"] = index
        if row is not None:
            for source, destination in (("id", "id"), ("exercise_example_id", "exercise_id")):
                safe_id = canonical_uuid(row.get(source))
                if safe_id:
                    item[destination] = safe_id
        if field is not None:
            item["field"] = field
        if count is not None:
            item["count"] = count
        self.diagnostics.append(item)

    def finding(self, code, *args, **kwargs):
        self.emit("finding", code, *args, **kwargs)

    def observation(self, code, *args, **kwargs):
        self.emit("observation", code, *args, **kwargs)

    def text(self, table, row, index, field, nullable):
        if field not in row:
            return
        value = row[field]
        if value is None and nullable:
            self.observation("text_null_fallback_or_review", table, row, index, field)
        elif not isinstance(value, str):
            self.finding("text_type_invalid", table, row, index, field)
        elif not value.strip():
            self.observation("text_blank", table, row, index, field)
        else:
            if value != value.strip():
                self.observation("text_outer_whitespace", table, row, index, field)
            if "\ufffd" in value or any(ord(char) < 32 and char not in "\n\r\t" for char in value):
                self.observation("text_encoding_or_control_character", table, row, index, field)
            if PLACEHOLDER.search(value.strip()):
                self.observation("text_possible_placeholder", table, row, index, field)

    def enum(self, table, row, index, field, allowed, nullable=True):
        if field not in row:
            return
        value = row[field]
        if value is None and nullable:
            self.observation("enum_null_review", table, row, index, field)
        elif not isinstance(value, str) or value not in allowed:
            self.finding("enum_invalid", table, row, index, field)

    def basic_rows(self):
        for table, rows in self.tables.items():
            seen = set()
            for index, row in enumerate(rows):
                for field in FIELDS[table]:
                    if field not in row:
                        self.finding("required_field_missing", table, row, index, field)
                row_id = canonical_uuid(row.get("id"))
                if "id" in row and row_id is None:
                    self.finding("uuid_invalid", table, row, index, "id")
                elif row_id is not None:
                    if row_id in seen:
                        self.finding("id_duplicate", table, row, index, "id")
                    seen.add(row_id)
                for field in ("created_at", "updated_at"):
                    if field in row and (not isinstance(row[field], str) or not row[field].strip()):
                        self.finding("timestamp_type_invalid", table, row, index, field)
                for field, target in FKS.get(table, ()):
                    if field not in row:
                        continue
                    if row[field] is None and (table, field) in NULLABLE_GROUP_FKS:
                        self.observation("dictionary_group_unassigned", table, row, index, field)
                        continue
                    value = canonical_uuid(row[field])
                    if value is None:
                        self.finding("foreign_key_uuid_invalid", table, row, index, field)
                    elif value not in self.ids[target]:
                        self.finding("foreign_key_orphan", table, row, index, field)

    def unique_pairs(self, table, fields):
        seen = set()
        for index, row in enumerate(self.tables[table]):
            values = tuple(row.get(field) for field in fields)
            # Invalid scalar shapes are handled elsewhere; avoid hashing nested input.
            if any(not isinstance(value, str) for value in values):
                continue
            key = tuple(value.lower() if field.endswith("_id") else value
                        for field, value in zip(fields, values))
            if key in seen:
                self.finding("relation_duplicate", table, row, index, fields[-1])
            seen.add(key)

    def muscle_maps(self):
        grouped = defaultdict(list)
        for index, row in enumerate(self.tables["exercise_example_bundles"]):
            exercise_id = canonical_uuid(row.get("exercise_example_id"))
            if exercise_id:
                grouped[exercise_id].append(row)
            if "percentage" not in row:
                continue
            value = row["percentage"]
            if not valid_percentage(value):
                self.finding("percentage_integer_or_bounds_invalid", "exercise_example_bundles", row, index, "percentage")
            elif value == 0:
                self.observation("zero_percentage_editorial_review", "exercise_example_bundles", row, index, "percentage")
        for index, row in enumerate(self.tables["exercise_examples"]):
            values = grouped.get(canonical_uuid(row.get("id")), [])
            if not values:
                self.finding("muscle_map_empty", "exercise_examples", row, index)
            elif all(valid_percentage(item.get("percentage")) for item in values):
                if sum(item["percentage"] for item in values) != 100:
                    self.finding("muscle_map_sum_not_100", "exercise_examples", row, index)

    def components(self):
        grouped = Counter()
        table = "exercise_example_components"
        for index, row in enumerate(self.tables[table]):
            exercise_id = canonical_uuid(row.get("exercise_example_id"))
            if exercise_id:
                grouped[exercise_id] += 1
            for field in ("external_weight_required", "extra_weight_required", "assist_weight_required"):
                if field in row and row[field] is not None and type(row[field]) is not bool:
                    self.finding("component_boolean_or_null_invalid", table, row, index, field)
            multiplier = row.get("body_weight_multiplier")
            if "body_weight_multiplier" in row and multiplier is not None:
                number = decimal_number(multiplier)
                if number is None or not Decimal("0.05") <= number <= Decimal("2.0"):
                    self.finding("body_multiplier_invalid", table, row, index, "body_weight_multiplier")
            fields = FIELDS[table][4:]
            if not all(field in row for field in fields):
                continue
            external = row["external_weight_required"] is not None
            body = multiplier is not None
            supplementary = row["extra_weight_required"] is not None or row["assist_weight_required"] is not None
            if external and body:
                self.finding("external_body_mutually_exclusive", table, row, index)
            if supplementary and not body:
                self.finding("extra_assist_require_body", table, row, index)
            if external and supplementary:
                self.finding("external_extra_assist_mutually_exclusive", table, row, index)
            if canonical_uuid(row.get("id")) != exercise_id and canonical_uuid(row.get("id")) and exercise_id:
                self.observation("components_pk_differs_from_exercise_service_convention", table, row, index)
        for index, row in enumerate(self.tables["exercise_examples"]):
            count = grouped[canonical_uuid(row.get("id"))]
            if count != 1:
                self.finding("components_exactly_one_required", "exercise_examples", row, index, count=count)

    def text_and_enums(self):
        for table in ("exercise_examples", "exercise_example_translations", "muscles", "muscle_groups", "equipments", "equipment_groups"):
            for index, row in enumerate(self.tables[table]):
                self.text(table, row, index, "name", table.startswith("exercise_"))
                if table.startswith("exercise_"):
                    self.text(table, row, index, "description", True)
                if table == "exercise_examples":
                    self.text(table, row, index, "image_url", True)
                    for field in ("category", "weight_type", "force_type", "experience"):
                        self.enum(table, row, index, field, ENUMS[field])
                elif table == "exercise_example_translations":
                    self.enum(table, row, index, "language", LANGUAGES, nullable=False)
                else:
                    self.enum(table, row, index, "type", ENUMS[table])
        for index, row in enumerate(self.tables["muscles"]):
            value = row.get("recovery")
            if "recovery" in row and value is not None and (not integral_json_number(value) or value < 0):
                self.finding("recovery_integer_nonnegative_or_null_invalid", "muscles", row, index, "recovery")
            for field in ("size", "sensitivity"):
                if field in row and row[field] is not None and decimal_number(row[field]) is None:
                    self.finding("numeric_or_null_invalid", "muscles", row, index, field)
        languages = defaultdict(set)
        for row in self.tables["exercise_example_translations"]:
            exercise_id = canonical_uuid(row.get("exercise_example_id"))
            language = row.get("language")
            if exercise_id and isinstance(language, str) and language in LANGUAGES:
                languages[exercise_id].add(language)
        for index, row in enumerate(self.tables["exercise_examples"]):
            missing = len(set(LANGUAGES) - languages[canonical_uuid(row.get("id"))])
            if missing:
                self.observation("translation_languages_missing_fallback_possible", "exercise_examples", row, index, count=missing)

    def run(self):
        self.basic_rows()
        self.unique_pairs("exercise_example_bundles", ("exercise_example_id", "muscle_id"))
        self.unique_pairs("exercise_examples_equipments", ("exercise_example_id", "equipment_id"))
        self.unique_pairs("exercise_example_translations", ("exercise_example_id", "language"))
        self.muscle_maps()
        self.components()
        self.text_and_enums()
        if not self.tables["exercise_examples"]:
            self.observation("catalog_empty_coverage_only", "exercise_examples", count=0)
        findings = sum(item["severity"] == "finding" for item in self.diagnostics)
        observations = len(self.diagnostics) - findings
        return {
            "tool": "grippo-exercise-audit/inspect_snapshot", "version": VERSION,
            "status": "structural_findings" if findings else "structural_pass",
            "summary": {"findings": findings, "observations": observations,
                        "codes": dict(sorted(Counter(item["code"] for item in self.diagnostics).items()))},
            "coverage": {
                "scope": "local_catalog_snapshot_structure_only",
                "tables": {table: {"rows": len(rows), "unique_valid_ids": len(self.ids[table])}
                           for table, rows in self.tables.items()},
                "performed": ["required_fields_and_types", "ids_and_foreign_keys", "relation_duplicates", "muscle_map_integer_bounds_and_total", "components_and_null_false_semantics", "stored_language_coverage", "limited_text_quality_observations", "enum_membership"],
                "not_performed": ["live_database_freshness_or_completeness", "all_database_constraints", "scientific_or_biomechanical_validity", "percentage_physiological_accuracy", "difficulty_or_exercise_category_judgment", "video_or_equipment_identity", "clinical_safety", "translation_semantic_equivalence", "client_or_historical_metrics_impact"],
            },
            "diagnostics": self.diagnostics,
        }


def main(argv=None):
    parser = Parser(description=__doc__, add_help=False)
    parser.add_argument("snapshot", help="explicit existing local .json file with payload tables")
    raw = None
    try:
        args = parser.parse_args(argv)
        path = Path(args.snapshot)
        if path.suffix.lower() != ".json" or not path.is_file():
            raise InvalidInput("local_json_file_required")
        if path.stat().st_size > MAX_BYTES:
            raise InvalidInput("input_size_limit")
        with path.open("rb") as handle:
            raw = handle.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise InvalidInput("input_size_limit")
        document = json.loads(raw.decode("utf-8-sig"), object_pairs_hook=unique_object,
                              parse_constant=forbidden_constant, parse_float=finite_json_float)
        if not isinstance(document, dict) or not isinstance(document.get("payload"), dict):
            raise InvalidInput("root_payload_object_required")
        payload = document["payload"]
        if any(table not in payload for table in FIELDS):
            raise InvalidInput("catalog_table_missing")
        tables = {}
        for table in FIELDS:
            rows = payload[table]
            if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
                raise InvalidInput("catalog_table_or_row_shape_invalid")
            tables[table] = rows
        result = Inspector(tables).run()
        exit_code = 1 if result["summary"]["findings"] else 0
    except (InvalidInput, UnicodeError, json.JSONDecodeError, OSError, RecursionError, ValueError) as error:
        code = str(error) if isinstance(error, InvalidInput) else "input_unreadable_or_invalid_json"
        result = {"tool": "grippo-exercise-audit/inspect_snapshot", "version": VERSION,
                  "status": "invalid_input", "summary": {"findings": 0, "observations": 0},
                  "coverage": {"scope": "not_run_invalid_input"},
                  "diagnostics": [{"severity": "input_error", "code": code}]}
        exit_code = 2
    if raw is not None:
        result["input_sha256"] = hashlib.sha256(raw).hexdigest()
        result["input_bytes"] = len(raw)
    print(json.dumps(result, ensure_ascii=True, sort_keys=True))
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
