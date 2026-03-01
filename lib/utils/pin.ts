// PIN generation utilities

const BANNED_PINS = ['000000', '111111', '222222', '333333', '444444', '555555',
    '666666', '777777', '888888', '999999', '123456', '654321', '012345'];

/**
 * Generate a random 6-digit PIN avoiding trivial sequences
 */
export function generatePin(): string {
    let pin: string;
    do {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (BANNED_PINS.includes(pin));
    return pin;
}

/**
 * Format PIN for display: "782134" → "782 134"
 */
export function formatPin(pin: string): string {
    return `${pin.slice(0, 3)} ${pin.slice(3)}`;
}
