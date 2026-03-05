const { google } = require('googleapis');

class GoogleSheetsAPI {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        this.initAuth();
    }

    initAuth() {
        try {
            if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
                console.warn('⚠️ GOOGLE_SERVICE_ACCOUNT belum di-set.');
                return;
            }

            const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

            this.auth = new google.auth.GoogleAuth({
                credentials: serviceAccount,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });

        } catch (error) {
            console.error('❌ Error inisialisasi Google Sheets API:', error.message);
        }
    }

    async appendData(range, values) {
        this.validate();
        const response = await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });
        return { success: true, data: response.data };
    }

    async getData(range) {
        this.validate();
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range,
        });
        return { success: true, data: response.data.values };
    }

    async updateData(range, values) {
        this.validate();
        const response = await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });
        return { success: true, data: response.data };
    }

    async clearData(range) {
        this.validate();
        const response = await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range,
        });
        return { success: true, data: response.data };
    }

    validate() {
        if (!this.spreadsheetId) {
            throw new Error('GOOGLE_SPREADSHEET_ID belum diisi');
        }
        if (!this.sheets) {
            throw new Error('Google Sheets API belum terinisialisasi');
        }
    }
}

module.exports = new GoogleSheetsAPI();