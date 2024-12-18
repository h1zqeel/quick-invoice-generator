const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const ejs = require("ejs");
const wkhtmltopdf = require("wkhtmltopdf");

const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"));

db.serialize(() => {
	db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL,
        pdf BLOB
    )`);

	db.run(`CREATE TABLE IF NOT EXISTS templates (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		client_name TEXT,
		client_email TEXT,
		client_address_street TEXT,
		client_address_street2 TEXT,
		client_address_city TEXT,
		client_address_state TEXT,
		client_address_zip TEXT,
		client_address_country TEXT,
		trader_name TEXT,
		trader_buisness_identifiers TEXT,
		trader_address_street TEXT,
		trader_address_street2 TEXT,
		trader_address_city TEXT,
		trader_address_state TEXT,
		trader_address_zip TEXT,
		trader_address_country TEXT,
		trader_email TEXT,
		trader_phone TEXT,
		client_trader_payment_terms TEXT,
		invoice_notes TEXT,
		invoice_payment_details_title TEXT,
		invoice_payment_details_notes TEXT
	);`);
});

let mainWindow;

app.on("ready", () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mainWindow.webContents.openDevTools();

	mainWindow.loadFile("index.html");
});

ipcMain.on("generate-pdf", async (event, invoiceData) => {
	try {
		invoiceData.items = invoiceData.items || [];
		const templatePath = path.resolve(
			__dirname,
			"templates",
			"invoice.ejs"
		);

		const templateId = invoiceData.templateId;

		const templateData = await new Promise((resolve, reject) => {
			db.get(
				`SELECT * FROM templates WHERE id = ?`,
				[templateId],
				(err, row) => {
					if (err) {
						reject(err);
					} else {
						resolve(row);
					}
				}
			);
		});

		const cssPath = path.join(__dirname, "assets/css/output.css");
		const inlineCSS = fs.readFileSync(cssPath, "utf-8");

		const html = await ejs.renderFile(templatePath, {
			invoice: invoiceData,
			template: templateData,
			inlineCSS: inlineCSS,
		});

		const pdfFilePath = path.join(
			__dirname,
			`invoice_${invoiceData.invoiceNumber}.pdf`
		);

		wkhtmltopdf(
			html,
			{
				output: pdfFilePath,
				enableLocalFileAccess: true,
				marginTop: "10mm",
				marginBottom: "10mm",
				marginLeft: "10mm",
				marginRight: "10mm",
				userStyleSheet: null,
				printMediaType: true,
			},
			(err) => {
				if (err) {
					console.error("PDF generation error:", err);
					event.reply("pdf-generated", { success: false });
					return;
				}

				const pdfBuffer = fs.readFileSync(pdfFilePath);

				db.run(
					`INSERT INTO invoices (invoice_number, pdf) VALUES (?, ?)`,
					[invoiceData.invoiceNumber, pdfBuffer],
					(err) => {
						if (err) {
							console.error("Database insertion error:", err);
							event.reply("pdf-generated", { success: false });
							return;
						}
						event.reply("pdf-generated", {
							success: true,
							filePath: pdfFilePath,
						});
					}
				);
			}
		);
	} catch (error) {
		console.error("Error generating PDF:", error);
		event.reply("pdf-generated", { success: false });
	}
});

ipcMain.on("get-invoices", (event) => {
	db.all(`SELECT id, invoice_number FROM invoices`, (err, rows) => {
		if (err) {
			console.error("Error fetching invoices:", err);
			event.reply("invoices-list", []);
		} else {
			event.reply("invoices-list", rows);
		}
	});
});

ipcMain.on("download-invoice", (event, invoiceId) => {
	db.get(`SELECT pdf FROM invoices WHERE id = ?`, [invoiceId], (err, row) => {
		if (err) {
			console.error("Error downloading invoice:", err);
			event.reply("invoice-download", { success: false });
			return;
		}

		const filePath = path.join(__dirname, `invoice-${invoiceId}.pdf`);

		fs.writeFileSync(filePath, row.pdf);

		event.reply("invoice-download", { success: true, path: filePath });
	});
});

ipcMain.on("delete-invoice", (event, invoiceId) => {
	db.run(`DELETE FROM invoices WHERE id = ?`, [invoiceId], (err) => {
		if (err) {
			console.error("Error deleting invoice:", err);
			event.reply("invoice-deleted", { success: false });
		} else {
			event.reply("invoice-deleted", { success: true });
		}
	});
});

ipcMain.on("save-template", (event, templateData) => {
	db.run(
		`INSERT INTO templates (
			name, 
			client_name, 
			client_email, 
			client_address_street, 
			client_address_street2, 
			client_address_city, 
			client_address_state, 
			client_address_zip, 
			client_address_country, 
			trader_name, 
			trader_buisness_identifiers, 
			trader_address_street, 
			trader_address_street2, 
			trader_address_city, 
			trader_address_state, 
			trader_address_zip, 
			trader_address_country, 
			trader_email, 
			trader_phone, 
			client_trader_payment_terms, 
			invoice_notes, 
			invoice_payment_details_title, 
			invoice_payment_details_notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			templateData.name,
			templateData.clientName,
			templateData.clientEmail,
			templateData.clientAddressStreet,
			templateData.clientAddressStreet2,
			templateData.clientAddressCity,
			templateData.clientAddressState,
			templateData.clientAddressZip,
			templateData.clientAddressCountry,
			templateData.traderName,
			templateData.traderBusinessIdentifiers,
			templateData.traderAddressStreet,
			templateData.traderAddressStreet2,
			templateData.traderAddressCity,
			templateData.traderAddressState,
			templateData.traderAddressZip,
			templateData.traderAddressCountry,
			templateData.traderEmail,
			templateData.traderPhone,
			templateData.clientTraderPaymentTerms,
			templateData.invoiceNotes,
			templateData.invoicePaymentDetailsTitle,
			templateData.invoicePaymentDetailsNotes,
		],
		(err) => {
			if (err) {
				console.error("Error saving template:", err);
				event.reply("template-saved", { success: false });
			} else {
				event.reply("template-saved", { success: true });
			}
		}
	);
});

ipcMain.on("delete-template", (event, templateId) => {
	db.run(`DELETE FROM templates WHERE id = ?`, [templateId], (err) => {
		if (err) {
			console.error("Error deleting template:", err);
			event.reply("template-deleted", { success: false });
		} else {
			event.reply("template-deleted", { success: true });
		}
	});
});

ipcMain.on("fetch-template", (event, templateId) => {
	db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
		if (err) {
			console.error("Error fetching template:", err);
			event.reply("template-details", {});
		} else {
			event.reply("template-details", row);
		}
	});
});

ipcMain.on("get-templates", (event) => {
	db.all(`SELECT * FROM templates`, (err, rows) => {
		if (err) {
			console.error("Error fetching templates:", err);
			event.reply("templates-list", []);
		} else {
			event.reply("templates-list", rows);
		}
	});
});
