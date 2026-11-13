"""Bound a cassette connector option and screen exposed high-impedance sense."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def evaluate():
    previous = HERE.parent/'attempt-4'
    bounds = json.loads((previous/'connector-bounds-results.json').read_text())['values']
    study = HERE.parent/'attempt-5'
    cassette = json.loads((study/'cassette-geometry-results.json').read_text())['extended']
    sense = json.loads((study/'sense-feasibility-results.json').read_text())
    conductor_count = 20
    inputs = 12
    main_paths = 2
    separate_monitor_paths = 2 * (1 + 1 + 1)  # supply, return, validity for each domain
    case_voltage = 7.2
    ir_test_floor = 1e9  # EIA-364-21 criterion in Samtec family specification p. 2
    ir_test_reported = 5e9  # Reported test value, not a new product guarantee
    budget = sense['board_leak_limit_at_604k_nA']
    remaining_connector_leak_nA = budget - 2.5
    screen = []
    for count in (1, 2, 3):
        leakage = count * case_voltage / ir_test_floor * 1e9
        screen.append({'hypothetical_parallel_leak_paths':count,'allocated_voltage_v':case_voltage,
                       'computed_sum_nA':leakage,'inside_measurement_budget':leakage<=budget})
    contact_cut = bounds['required_lift_without_mated_separation_credit_mm']
    release = min(row['own_tongue_release_mm'] for row in cassette['analytic_barriers'])
    assert release > contact_cut and cassette['withdrawal_mm'] > release
    assert screen[0]['inside_measurement_budget'] and not screen[1]['inside_measurement_budget']
    return {
        'scope':'Conditional calculation and source screening, no pin assignment or selected hardware',
        'candidate':['SFM-110-T2-S-D-A','TFM-110-02-S-D-A'], 'contacts':conductor_count,
        'socket_length_reference_mm':10*1.27+3.94,
        'passive_cassette_route_count':inputs+main_paths,
        'cassette_local_analog_route_lower_bound':separate_monitor_paths+main_paths,
        'capacity_limits':'No contact-to-route allocation. Return, protection, auxiliary and power parallel routes need exact inventory.',
        'conditional_last_cut_with_2mm_gap_mm':contact_cut,
        'modeled_own_tongue_release_mm':release,
        'conditional_axial_margin_mm':release-contact_cut,
        'scope_of_height_transfer':'Same lead/SMT section heights and same bounded conductive envelope, pivot, relative tilt, datum, assembly loss and protrusions. Not established on assembled cassette.',
        'insulation_test_criterion_ohm':ir_test_floor, 'reported_qualification_value_ohm':ir_test_reported,
        'previous_total_node_leak_budget_nA':budget,
        'remaining_connector_leak_nA_if_board_and_wiring_use_2p5nA':remaining_connector_leak_nA,
        'equivalent_connector_insulation_ohm_at_allocated_delta_v':case_voltage/(remaining_connector_leak_nA*1e-9),
        'test_floor_screen':screen,
        'limitations':['Insulation test data does not guarantee distributed leakage at application voltages over temperature, humidity, wear and assembly contamination.',
                       'No assumption that all paths see 7.2 V simultaneously. Screening cannot establish actual connector leakage or prove failure of a measured sample.',
                       'The 2500-cycle report covers the exact 50-contact pair, not this 20-contact variant.'],
    }


if __name__ == '__main__':
    result = evaluate()
    (HERE/'connector-allocation-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
