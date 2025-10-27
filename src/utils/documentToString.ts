export function documentToString(document: Document) {
	let doctype = "";

	if (document.doctype) {
		// 2. Reconstruct the DOCTYPE string
		doctype += `<!DOCTYPE ${document.doctype.name}`;

		if (document.doctype.publicId) {
			doctype += ` PUBLIC "${document.doctype.publicId}"`;
		}

		if (document.doctype.systemId) {
			doctype += ` "${document.doctype.systemId}"`;
		}

		doctype += ">\n";
	}

	return doctype + document.documentElement.outerHTML;
}
