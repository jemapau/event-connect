import QRCode from 'qrcode';

/**
 * Generate a QR code DataURL for a session PIN
 */
export async function generateQRDataURL(sessionPin: string): Promise<string> {
    const appUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const joinUrl = `${appUrl}/join?pin=${sessionPin}`;
    return QRCode.toDataURL(joinUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
    });
}
