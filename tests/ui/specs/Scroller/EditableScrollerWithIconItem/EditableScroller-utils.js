async function findItemWrapper () {
	return await browser.execute(function () {
		let node = document.activeElement;
		let index;
		while (node.dataset) {
			index = node.dataset['index'];
			if (index) {
				break;
			}
			node = node.parentNode;
		}
		return {
			node: node ?? null,
			index: index ?? null,
			classList: node?.classList
		};
	});
}

async function focusedItemButton () {
	const {index} = await findItemWrapper();
	return await browser.execute(function () {
		const node = document.activeElement;
		return {
			ariaLabel: node.ariaLabel,
			index
		};
	});
}

async function disabledAttribute () {
	return await browser.execute(function () {
		return document.activeElement?.getAttribute?.('aria-disabled') === 'true';
	});
}

async function expectFocusedItem (expectedIndex, comment = 'focused item') {
	const {index} = await findItemWrapper();
	expect(index, comment).to.equal(expectedIndex);
}

async function expectDisabledItem (expectedIndex, comment = 'disabled item') {
	const {index} = await findItemWrapper();
	const disabled = await disabledAttribute();
	expect(index, comment).to.equal(expectedIndex);
	expect(disabled, comment).to.be.true();
}

async function expectDeleteButton (expectedIndex, comment = 'delete button') {
	const {ariaLabel, index} = await focusedItemButton();
	expect(index, comment).to.equal(expectedIndex);
	expect(ariaLabel, comment).to.equal('Delete');
}

async function expectItemWrapperClass (expectedClass, comment = 'item wrapper class') {
	const {classList} = await findItemWrapper();
	expect(classList?.includes?.(expectedClass), comment).to.be.true();
}

exports.expectFocusedItem = expectFocusedItem;
exports.expectDisabledItem = expectDisabledItem;
exports.expectDeleteButton = expectDeleteButton;
exports.expectItemWrapperClass = expectItemWrapperClass;