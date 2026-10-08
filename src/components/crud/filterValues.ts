// Filter fields support selecting more than one value per column — the wire format stays a single
// string (so TableFilterField/onApplyFilters/page state don't all need to become array-typed), with
// individual values joined by the ASCII unit separator control character, which is reserved exactly
// for this ("separate list items") and never appears in option labels typed or picked by a user.
const DELIMITER = '\u001F'

export function splitFilterValue(value: string | undefined): string[] {
    return value ? value.split(DELIMITER).filter(Boolean) : []
}

export function joinFilterValue(values: string[]): string {
    return values.join(DELIMITER)
}
