import {mount, shallow} from 'enzyme';
import {Dropdown, DropdownBase} from '../Dropdown';
import DropdownList from '../DropdownList';

const children = ['option1', 'option2', 'option3'];
const placeholder = 'Dropdown select';
const title = 'Options';

describe('Dropdown', () => {
	test('should have default `placeholder` when a value is not provided', () => {
		const dropDown = shallow(
			<DropdownBase>
				{children}
			</DropdownBase>
		);

		const expected = 'No Selection';
		const actual = dropDown.find('DropdownButton').prop('children');

		expect(actual).toBe(expected);
	});

	test('should have `placeholder` when a value is provided', () => {
		const dropDown = shallow(
			<DropdownBase placeholder={placeholder}>
				{children}
			</DropdownBase>
		);

		const expected = placeholder;
		const actual = dropDown.find('DropdownButton').prop('children');

		expect(actual).toBe(expected);
	});

	test('should have `title`', () => {
		const dropDown = mount(
			<DropdownBase title={title}>
				{children}
			</DropdownBase>
		);

		const expected = title;
		const actual = dropDown.find('.heading').text();

		expect(actual).toBe(expected);
	});

	test('should apply id to dropdown', () => {
		const dropDown = mount(
			<DropdownBase id="drop">
				{children}
			</DropdownBase>
		);

		const expected = 'drop';
		// NOTE: Using `#id` as a find will pass because Enzyme will find the id prop and use that
		// instead of what is rendered into the DOM.
		const actual = dropDown.getDOMNode().id;

		expect(actual).toBe(expected);
	});

	test('should apply aria label id to `title`', () => {
		const dropDown = mount(
			<DropdownBase title={title} id="drop">
				{children}
			</DropdownBase>
		);

		const expected = true;
		const actual = dropDown.find('#drop_title').exists();

		expect(actual).toBe(expected);
	});

	test('should apply aria-labeled-by to dropdown with title', () => {
		const dropDown = mount(
			<DropdownBase title={title} id="drop">
				{children}
			</DropdownBase>
		);

		const expected = true;
		const actual = dropDown.find('[aria-labelledby="drop_title"]').exists();

		expect(actual).toBe(expected);
	});

	test('should not apply aria-labeled-by when no title exists', () => {
		const dropDown = mount(
			<DropdownBase id="drop">
				{children}
			</DropdownBase>
		);

		const expected = false;
		const actual = dropDown.find('[aria-labelledby]').exists();

		expect(actual).toBe(expected);
	});

	test('should have `placeholder` when `children` is invalid', () => {
		const dropDown = shallow(
			<DropdownBase placeholder={placeholder}>
				{null}
			</DropdownBase>
		);

		const expected = placeholder;
		const actual = dropDown.find('DropdownButton').prop('children');

		expect(actual).toBe(expected);
	});

	test('should have `placeholder` that reflects `selected` option', () => {
		const selectedIndex = 1;

		const dropDown = shallow(
			<DropdownBase selected={selectedIndex}>
				{children}
			</DropdownBase>
		);

		const expected = children[selectedIndex];
		const actual = dropDown.find('DropdownButton').prop('children');

		expect(actual).toBe(expected);
	});

	test('should have `placeholder` when `selected` is invalid', () => {
		const dropDown = shallow(
			<DropdownBase placeholder={placeholder} selected={-1}>
				{children}
			</DropdownBase>
		);

		const expected = placeholder;
		const actual = dropDown.find('DropdownButton').prop('children');

		expect(actual).toBe(expected);
	});

	test('should be disabled when `children` is omitted', () => {
		const dropDown = mount(
			<DropdownBase title={title} />
		);

		const expected = true;
		const actual = dropDown.find('DropdownButton').prop('disabled');

		expect(actual).toBe(expected);
	});

	test('should be disabled when there are no `children`', () => {
		const dropDown = mount(
			<DropdownBase title={title}>
				{[]}
			</DropdownBase>
		);

		const expected = true;
		const actual = dropDown.find('DropdownButton').prop('disabled');

		expect(actual).toBe(expected);
	});

	test('should update when children are added', () => {
		const dropDown = shallow(
			<Dropdown title={title}>
				{children}
			</Dropdown>
		);

		const updatedChildren = children.concat('option4', 'option5');
		dropDown.setProps({children: updatedChildren});

		const expected = 5;
		const actual = dropDown.children().length;

		expect(actual).toBe(expected);
	});

	test('should set the `role` of items to "checkbox"', () => {
		const dropDown = shallow(
			<DropdownBase title={title} defaultOpen>
				{['item']}
			</DropdownBase>
		);

		const expected = 'checkbox';
		const actual = dropDown.find('DropdownButton').prop('popupProps').children[0].role;

		expect(actual).toBe(expected);
	});

	test('should set the `aria-checked` state of the `selected` item', () => {
		const dropDown = shallow(
			<DropdownBase title={title} selected={0}>
				{['item']}
			</DropdownBase>
		);

		const expected = true;
		const actual = dropDown.find('DropdownButton').prop('popupProps').children[0]['aria-checked'];

		expect(actual).toBe(expected);
	});

	test('should pass through members of child objects to props for each item', () => {
		const dropDown = shallow(
			<DropdownBase title={title}>
				{[{
					disabled: true,
					children: 'child',
					key: 'item-0'
				}]}
			</DropdownBase>
		);

		const expected = true;
		const actual = dropDown.find('DropdownButton').prop('popupProps').children[0].disabled;

		expect(actual).toBe(expected);
	});

	test('should allow members in child object to override injected aria values', () => {
		const dropDown = shallow(
			<DropdownBase title={title} selected={0}>
				{[{
					disabled: true,
					children: 'child',
					key: 'item-0',
					role: 'button',
					'aria-checked': false
				}]}
			</DropdownBase>
		);

		const expected = {
			role: 'button',
			'aria-checked': false
		};
		const actual = dropDown.find('DropdownButton').prop('popupProps').children[0];

		expect(actual).toMatchObject(expected);
	});

	describe('DropdownList', () => {
		test('should include `data` and `selected` in `onSelect` callback', () => {
			const handler = jest.fn();
			const dropDown = mount(
				<DropdownList onSelect={handler}>
					{children}
				</DropdownList>
			);

			dropDown.find('Item').at(0).simulate('click');

			const expected = {data: 'option1', selected: 0};
			const actual = handler.mock.calls[0][0];

			expect(actual).toEqual(expected);
		});
	});
});
