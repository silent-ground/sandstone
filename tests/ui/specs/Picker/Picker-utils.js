// Utility methods for testing

const extractValue = async (picker) => {
	return await picker.currentValue(picker.self).getText();
};

export {
	extractValue
};
