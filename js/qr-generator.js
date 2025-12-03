/**
 * QR Code Generator for Officing Check-in System
 * Generates QR codes with tag parameters for location-based check-ins
 */

// Store generated QR codes
let generatedQRCodes = [];

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Try to load base URL from localStorage or use current origin
    const savedBaseUrl = localStorage.getItem('officing_base_url');
    const baseUrlInput = document.getElementById('baseUrl');
    
    if (savedBaseUrl) {
        baseUrlInput.value = savedBaseUrl;
    } else {
        // Default to current origin
        baseUrlInput.value = window.location.origin + window.location.pathname.replace('qr-generator.html', '');
    }
});

/**
 * Generate a single QR code
 */
function generateSingleQR() {
    const tag = document.getElementById('singleTag').value.trim();
    const baseUrl = document.getElementById('baseUrl').value.trim();

    // Validation
    if (!tag) {
        showError('タグ名を入力してください');
        return;
    }

    if (!baseUrl) {
        showError('ベースURLを入力してください');
        return;
    }

    // Save base URL for future use
    localStorage.setItem('officing_base_url', baseUrl);

    // Clear previous QR codes
    generatedQRCodes = [];

    // Generate QR code
    const qrData = {
        tag: tag,
        url: buildCheckInUrl(baseUrl, tag)
    };

    generatedQRCodes.push(qrData);
    renderQRCodes();

    // Clear input
    document.getElementById('singleTag').value = '';
}

/**
 * Generate multiple QR codes from bulk input
 */
function generateBulkQR() {
    const bulkTags = document.getElementById('bulkTags').value;
    const baseUrl = document.getElementById('baseUrl').value.trim();

    // Validation
    if (!bulkTags.trim()) {
        showError('タグリストを入力してください');
        return;
    }

    if (!baseUrl) {
        showError('ベースURLを入力してください');
        return;
    }

    // Save base URL for future use
    localStorage.setItem('officing_base_url', baseUrl);

    // Parse tags (one per line)
    const tags = bulkTags
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (tags.length === 0) {
        showError('有効なタグが見つかりません');
        return;
    }

    // Clear previous QR codes
    generatedQRCodes = [];

    // Generate QR codes for each tag
    tags.forEach(tag => {
        const qrData = {
            tag: tag,
            url: buildCheckInUrl(baseUrl, tag)
        };
        generatedQRCodes.push(qrData);
    });

    renderQRCodes();

    // Clear input
    document.getElementById('bulkTags').value = '';
}

/**
 * Build check-in URL with tag parameter
 * @param {string} baseUrl - Base URL of the application
 * @param {string} tag - Location tag
 * @returns {string} Complete check-in URL
 */
function buildCheckInUrl(baseUrl, tag) {
    // Remove trailing slash from base URL if present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    // Encode tag parameter
    const encodedTag = encodeURIComponent(tag);
    
    // Build URL with tag parameter
    return `${cleanBaseUrl}/?tag=${encodedTag}`;
}

/**
 * Render all generated QR codes
 */
function renderQRCodes() {
    const qrGrid = document.getElementById('qrGrid');
    const qrOutput = document.getElementById('qrOutput');
    const emptyState = document.getElementById('emptyState');

    // Clear grid
    qrGrid.innerHTML = '';

    if (generatedQRCodes.length === 0) {
        qrOutput.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    // Show output section
    qrOutput.style.display = 'block';
    emptyState.style.display = 'none';

    // Generate QR code for each tag
    generatedQRCodes.forEach((qrData, index) => {
        const qrItem = createQRItem(qrData, index);
        qrGrid.appendChild(qrItem);
    });
}

/**
 * Create a QR code item element
 * @param {Object} qrData - QR code data
 * @param {number} index - Index in the array
 * @returns {HTMLElement} QR item element
 */
function createQRItem(qrData, index) {
    const item = document.createElement('div');
    item.className = 'qr-item';
    item.id = `qr-item-${index}`;

    // Tag name
    const tagName = document.createElement('div');
    tagName.className = 'tag-name';
    tagName.textContent = qrData.tag;
    item.appendChild(tagName);

    // QR code container
    const qrContainer = document.createElement('div');
    qrContainer.id = `qr-${index}`;
    item.appendChild(qrContainer);

    // Generate QR code using QRCode.js
    new QRCode(qrContainer, {
        text: qrData.url,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    // URL display
    const urlDisplay = document.createElement('div');
    urlDisplay.className = 'qr-url';
    urlDisplay.textContent = qrData.url;
    item.appendChild(urlDisplay);

    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary btn-download';
    downloadBtn.textContent = 'ダウンロード';
    downloadBtn.onclick = () => downloadQRCode(index, qrData.tag);
    item.appendChild(downloadBtn);

    return item;
}

/**
 * Download a single QR code as PNG
 * @param {number} index - Index of the QR code
 * @param {string} tag - Tag name for filename
 */
function downloadQRCode(index, tag) {
    const qrContainer = document.getElementById(`qr-${index}`);
    const canvas = qrContainer.querySelector('canvas');

    if (!canvas) {
        showError('QRコードが見つかりません');
        return;
    }

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-code-${sanitizeFilename(tag)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
}

/**
 * Download all QR codes as individual PNG files
 */
function downloadAllQR() {
    if (generatedQRCodes.length === 0) {
        showError('ダウンロードするQRコードがありません');
        return;
    }

    // Download each QR code with a small delay to avoid browser blocking
    generatedQRCodes.forEach((qrData, index) => {
        setTimeout(() => {
            downloadQRCode(index, qrData.tag);
        }, index * 200); // 200ms delay between downloads
    });
}

/**
 * Clear all generated QR codes
 */
function clearAll() {
    generatedQRCodes = [];
    renderQRCodes();
    document.getElementById('bulkTags').value = '';
    document.getElementById('singleTag').value = '';
}

/**
 * Sanitize filename for download
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    // Remove existing error alerts
    const existingAlerts = document.querySelectorAll('.alert-error');
    existingAlerts.forEach(alert => alert.remove());

    // Create error alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;

    // Insert at the top of the container
    const container = document.querySelector('.generator-container');
    container.insertBefore(alert, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * Extract tag from URL (for testing)
 * @param {string} url - Check-in URL
 * @returns {string|null} Extracted tag or null
 */
function extractTagFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('tag');
    } catch (e) {
        return null;
    }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        buildCheckInUrl,
        extractTagFromUrl,
        sanitizeFilename
    };
}
