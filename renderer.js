const { ipcRenderer, shell } = require("electron");

if (document.getElementById("invoice-form")) {
	const form = document.getElementById("invoice-form");
	const itemsContainer = document.getElementById("items-container");
	const addItemButton = document.getElementById("add-item");

	addItemButton.addEventListener("click", () => {
		const itemDiv = document.createElement("div");
		itemDiv.classList.add("item-row");
		itemDiv.innerHTML = `
			<div class="flex space-x-4 items-center">
				<input 
					type="text" 
					placeholder="Item Description Line 1" 
					class="item-description-1 w-1/4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
					required
				>
				<input 
					type="text" 
					placeholder="Item Description Line 2" 
					class="item-description-2 w-1/4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
					required
				>
				<input 
					type="text" 
					placeholder="Item Description Line 3" 
					class="item-description-3 w-1/4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
					required
				>

				<input 
					type="number" 
					placeholder="Hours" 
					class="item-hours w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
					min="1" 
					required
				>

				<input 
					type="number" 
					placeholder="Hourly Rate" 
					class="item-hourly-rate w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
					step="0.01"
					min="0" 
					required
				>

				<button 
					type="button" 
					class="remove-item bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					X
				</button>
			</div>
		`;

		itemsContainer.appendChild(itemDiv);

		itemDiv.querySelector(".remove-item").addEventListener("click", () => {
			itemDiv.remove();
		});
	});

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		const invoiceData = {
			invoiceNumber: document.getElementById("invoiceNumber").value,
			invoiceDate: document.getElementById("invoiceDate").value,
			dueByDate: document.getElementById("dueByDate").value,
			templateId: document.getElementById("templateSelect").value,
			items: [],
		};

		const itemRows = document.querySelectorAll(".item-row");
		itemRows.forEach((row) => {
			const descriptionLine1 = row.querySelector(
				".item-description-1"
			).value;
			const descriptionLine2 = row.querySelector(
				".item-description-2"
			).value;
			const descriptionLine3 = row.querySelector(
				".item-description-3"
			).value;
			const hours = parseFloat(row.querySelector(".item-hours").value);
			const hourlyRate = parseFloat(
				row.querySelector(".item-hourly-rate").value
			);

			if (descriptionLine1 && !isNaN(hours) && !isNaN(hourlyRate)) {
				invoiceData.items.push({
					descriptionLine1,
					descriptionLine2,
					descriptionLine3,
					hours,
					hourlyRate,
					subtotal: hours * hourlyRate,
				});
			}

			invoiceData.total = invoiceData.items.reduce(
				(total, item) => total + item.subtotal,
				0
			);
		});

		ipcRenderer.send("generate-pdf", invoiceData);
	});

	ipcRenderer.on("pdf-generated", (event, result) => {
		if (result.success) {
			alert("PDF generated successfully!");
		} else {
			alert("Error generating PDF.");
		}
	});

	const viewInvoicesButton = document.getElementById("view-invoices");
	if (viewInvoicesButton) {
		viewInvoicesButton.addEventListener("click", () => {
			window.location.href = "invoices.html";
		});
	}
	document.getElementById("manage-info").addEventListener("click", () => {
		window.location.href = "manage-info.html";
	});
	const templateSelect = document.getElementById("templateSelect");

	ipcRenderer.send("get-templates");
	ipcRenderer.on("templates-list", (event, templates) => {
		templateSelect.innerHTML =
			'<option value="">-- Select a Template --</option>';
		templates.forEach((template) => {
			const option = document.createElement("option");
			option.value = template.id;
			option.textContent = template.name;
			templateSelect.appendChild(option);
		});
	});

	// Pre-fill fields when template is selected
	templateSelect.addEventListener("change", () => {
		const templateId = templateSelect.value;
		if (templateId) {
			ipcRenderer.send("fetch-template", templateId);
		}
	});

	ipcRenderer.on("template-details", (event, template) => {
		document.getElementById("clientName").value =
			template.client_name || "";
		document.getElementById("traderName").value =
			template.trader_name || "";
		// Add additional fields here as necessary
	});
}

if (document.getElementById("invoices-table")) {
	ipcRenderer.send("get-invoices");

	ipcRenderer.on("invoices-list", (event, invoices) => {
		const tableBody = document.querySelector("#invoices-table tbody");
		tableBody.innerHTML = "";

		if (invoices.length === 0) {
			const noDataRow = document.createElement("tr");
			noDataRow.innerHTML = `
				<td colspan="4" style="text-align:center;">No Invoices Available</td>
			`;
			tableBody.appendChild(noDataRow);
		} else {
			invoices.forEach((invoice) => {
				const row = document.createElement("tr");
				row.innerHTML = `
					<td>${invoice.invoice_number}</td>
					<td>${invoice.template_name}</td>
					<td>${invoice.total_amount}</td>
					<td>
						<button class="download" data-id="${invoice.id}">View PDF</button>
						<button class="delete" data-id="${invoice.id}" style="color: red;">Delete</button>
					</td>
				`;

				tableBody.appendChild(row);
			});
		}

		document.querySelectorAll(".download").forEach((button) => {
			button.addEventListener("click", (event) => {
				const invoiceId = event.target.getAttribute("data-id");
				ipcRenderer.send("download-invoice", invoiceId);
			});
		});

		document
			.querySelector("#invoices-table")
			.addEventListener("click", (event) => {
				if (event.target.classList.contains("delete")) {
					const invoiceId = event.target.getAttribute("data-id");

					if (
						confirm("Are you sure you want to delete this invoice?")
					) {
						ipcRenderer.send("delete-invoice", invoiceId);
					}
				}

				if (event.target.classList.contains("download")) {
					const invoiceId = event.target.getAttribute("data-id");
					ipcRenderer.send("download-invoice", invoiceId);
				}
			});
	});

	ipcRenderer.on("invoice-download", (event, result) => {
		if (result.success) {
			shell.openPath(result.path);
		} else {
			alert("Failed to open the PDF.");
		}
	});

	ipcRenderer.on("invoice-deleted", (event, result) => {
		if (result.success) {
			alert("Invoice deleted successfully!");
			ipcRenderer.send("get-invoices");
		} else {
			alert("Error deleting the invoice.");
		}
	});

	const backButton = document.getElementById("back");
	if (backButton) {
		backButton.addEventListener("click", () => {
			window.location.href = "index.html";
		});
	}
}

if (document.getElementById("template-form")) {
	const form = document.getElementById("template-form");
	const templateList = document.getElementById("template-list");

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		const templateData = {
			name: document.getElementById("templateName").value,
			clientName: document.getElementById("clientName").value,
			clientEmail: document.getElementById("clientEmail").value,
			clientAddressStreet: document.getElementById("clientAddressStreet")
				.value,
			clientAddressStreet2: document.getElementById(
				"clientAddressStreet2"
			).value,
			clientAddressCity: document.getElementById("clientCity").value,
			clientAddressState: document.getElementById("clientState").value,
			clientAddressZip: document.getElementById("clientZip").value,
			clientAddressCountry:
				document.getElementById("clientCountry").value,
			traderName: document.getElementById("traderName").value,
			traderBusinessIdentifiers: document.getElementById(
				"traderBusinessIdentifiers"
			).value,
			traderAddressStreet: document.getElementById("traderAddressStreet")
				.value,
			traderAddressStreet2: document.getElementById(
				"traderAddressStreet2"
			).value,
			traderAddressCity: document.getElementById("traderCity").value,
			traderAddressState: document.getElementById("traderState").value,
			traderAddressZip: document.getElementById("traderZip").value,
			traderAddressCountry:
				document.getElementById("traderCountry").value,
			traderEmail: document.getElementById("traderEmail").value,
			traderPhone: document.getElementById("traderPhone").value,
			clientTraderPaymentTerms: document.getElementById(
				"clientTraderPaymentTerms"
			).value,
			invoiceNotes: document.getElementById("invoiceNotes").value,
			invoicePaymentDetailsTitle: document.getElementById(
				"paymentDetailsTitle"
			).value,
			invoicePaymentDetailsNotes: document.getElementById(
				"paymentDetailsNotes"
			).value,
		};

		console.log(templateData);

		ipcRenderer.send("save-template", templateData);
	});

	ipcRenderer.on("template-saved", (event, result) => {
		if (result.success) {
			alert("Template saved successfully!");
			fetchTemplates();
			form.reset();
		} else {
			alert("Error saving template.");
		}
	});

	function fetchTemplates() {
		ipcRenderer.send("get-templates");
	}

	ipcRenderer.on("templates-list", (event, templates) => {
		templateList.innerHTML = "";
		templates.forEach((template) => {
			console.log(template);
			const li = document.createElement("li");
			li.classList.add(
				"p-2",
				"border",
				"rounded",
				"flex",
				"justify-between",
				"items-center",
				"bg-white",
				"shadow"
			);

			li.innerHTML = `
        <div>
            <strong>${template.name ?? "Untitled"}</strong><br>
            Client: ${template.client_name ?? "N/A"}<br>
            Trader: ${template.trader_name ?? "N/A"}<br>
            Payment Terms: ${template.client_trader_payment_terms ?? "N/A"}
        </div>
        <button class="delete-btn bg-red-500 text-black px-4 py-2 rounded hover:bg-red-600 transition duration-150" data-id="${
			template.id
		}">Delete</button>
    `;
			templateList.appendChild(li);
		});

		document.querySelectorAll(".delete-btn").forEach((btn) => {
			btn.addEventListener("click", () => {
				const templateId = btn.getAttribute("data-id");
				ipcRenderer.send("delete-template", templateId);
			});
		});
	});

	ipcRenderer.on("template-deleted", (event, result) => {
		if (result.success) {
			alert("Template deleted successfully!");
			fetchTemplates();
		} else {
			alert("Error deleting template.");
		}
	});

	fetchTemplates();
}
