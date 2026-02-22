const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsAPI {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        this.initAuth();
    }

    initAuth() {
        try {
            if (!fs.existsSync(path.join(__dirname, 'service-account.json'))) {
                console.warn('⚠️ service-account.json tidak ditemukan. Google Sheets API tidak tersedia.');
                return;
            }

            const keyFile = require('./service-account.json');
            this.auth = new google.auth.GoogleAuth({
                keyFile: path.join(__dirname, 'service-account.json'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        } catch (error) {
            console.error('❌ Error inisialisasi Google Sheets API:', error.message);
        }
    }

    async appendData(range, values) {
        try {
            if (!this.spreadsheetId || this.spreadsheetId === 'your_spreadsheet_id_here') {
                throw new Error('GOOGLE_SPREADSHEET_ID belum diisi di file .env');
            }
            if (!this.sheets) {
                throw new Error('Google Sheets API tidak terinisialisasi (service-account.json?)');
            }

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values,
                },
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error append data:', error.message);
            throw error;
        }
    }

    async getData(range) {
        try {
            if (!this.spreadsheetId || this.spreadsheetId === 'your_spreadsheet_id_here') {
                throw new Error('GOOGLE_SPREADSHEET_ID belum diisi di file .env');
            }
            if (!this.sheets) {
                throw new Error('Google Sheets API tidak terinisialisasi (service-account.json?)');
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range,
            });

            return { success: true, data: response.data.values };
        } catch (error) {
            console.error('❌ Error get data:', error.message);
            throw error;
        }
    }

    async updateData(range, values) {
        try {
            if (!this.spreadsheetId || this.spreadsheetId === 'your_spreadsheet_id_here') {
                throw new Error('GOOGLE_SPREADSHEET_ID belum diisi di file .env');
            }
            if (!this.sheets) {
                throw new Error('Google Sheets API tidak terinisialisasi (service-account.json?)');
            }

            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values,
                },
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error update data:', error.message);
            throw error;
        }
    }

    async clearData(range) {
        try {
            if (!this.spreadsheetId || this.spreadsheetId === 'your_spreadsheet_id_here') {
                throw new Error('GOOGLE_SPREADSHEET_ID belum diisi di file .env');
            }
            if (!this.sheets) {
                throw new Error('Google Sheets API tidak terinisialisasi (service-account.json?)');
            }

            const response = await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: range,
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error clear data:', error.message);
            throw error;
        }
    }

    async batchUpdate(requests) {
        try {
            if (!this.spreadsheetId || this.spreadsheetId === 'your_spreadsheet_id_here') {
                throw new Error('GOOGLE_SPREADSHEET_ID belum diisi di file .env');
            }
            if (!this.sheets) {
                throw new Error('Google Sheets API tidak terinisialisasi (service-account.json?)');
            }

            const response = await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: requests,
                },
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error batch update:', error.message);
            throw error;
        }
    }

    async createSheet(sheetTitle) {
        try {
            if (!this.spreadsheetId || this.spreadsheetId === 'your_spreadsheet_id_here') {
                throw new Error('GOOGLE_SPREADSHEET_ID belum diisi di file .env');
            }
            if (!this.sheets) {
                throw new Error('Google Sheets API tidak terinisialisasi (service-account.json?)');
            }

            const response = await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: sheetTitle,
                                },
                            },
                        },
                    ],
                },
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('❌ Error create sheet:', error.message);
            throw error;
        }
    }
}

module.exports = new GoogleSheetsAPI();
