
// 1) Your existing helper functions (slightly adapted)
function getColourValues() {
    const rows = document.querySelectorAll('.item-library-edit__item-options-table__row');
    let result = [];

    rows.forEach(row => {
        const nameCell = row.querySelector('div[data-test-table-cell-option-name] span');
        if (!nameCell) return;

        if (nameCell.textContent.includes('Colour')) {
            const valueCell = row.querySelector('div[data-test-table-cell-option-values]');
            if (!valueCell) return;

            const values = valueCell.textContent
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);

            result = result.concat(values);
        }
    });

    return [...new Set(result)]; // unique values
}

function setCheckboxesByLabelValue(partialInclude, partialExclude, checked) {
    if (!Array.isArray(partialInclude) || partialInclude.length === 0) {
        // alert("partialInclude must be a non-empty array of strings");
        return [];
    }

    let labels = Array.from(
        document.querySelectorAll('label[data-test-editable-variation-table-select-variation]')
    );

    labels = labels.filter(label => {
        const val = label.getAttribute('data-test-editable-variation-table-select-variation') || '';
        return partialInclude.every(term => val.includes(term));
    });

    if (partialExclude) {
        labels = labels.filter(label => {
            const val = label.getAttribute('data-test-editable-variation-table-select-variation') || '';
            return !val.includes(partialExclude);
        });
    }

    labels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        if (!checkbox.checked) {
            checkbox.click(); // simulate click to keep Ember happy
        }
    });

    return labels;
}

function setWeightInputs(value) {
    const containers = document.querySelectorAll(
        '[data-test-editable-variation-table-weight-input-div]'
    );

    containers.forEach(div => {
        const input = div.querySelector('input');
        if (!input) return;

        input.focus();
        input.select();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    });

    return containers;
}

// 2) Create panel UI
function createPanel() {
    if (document.getElementById('custom-automation-panel')) {
        console.warn('Automation panel already exists.');
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'custom-automation-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '20px';
    panel.style.right = '20px';
    panel.style.width = '280px';
    panel.style.background = '#222';
    panel.style.color = '#eee';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    panel.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    panel.style.zIndex = 999999;
    panel.style.transition = 'height 0.3s ease';
    panel.style.overflow = 'hidden';

    // Initially collapsed
    let expanded = false;
    panel.style.height = '40px';

    // Header bar (click to toggle)
    const header = document.createElement('div');
    header.style.cursor = 'pointer';
    header.style.padding = '10px';
    header.style.fontWeight = 'bold';
    header.style.userSelect = 'none';
    header.textContent = 'Automation Panel ▼';

    header.onclick = () => {
        expanded = !expanded;
        if (expanded) {
            panel.style.height = 'auto';
            panel.style.padding = '10px';
            header.textContent = 'Automation Panel ▲';
            content.style.display = 'block';
        } else {
            panel.style.height = '40px';
            panel.style.padding = '0 10px';
            header.textContent = 'Automation Panel ▼';
            content.style.display = 'none';
        }
    };

    panel.appendChild(header);

    // Content container (hidden when collapsed)
    const content = document.createElement('div');
    content.style.display = 'none';
    content.style.marginTop = '10px';

    // Colour dropdown
    const colourLabel = document.createElement('label');
    colourLabel.textContent = 'Colour: ';
    colourLabel.style.display = 'block';
    colourLabel.style.marginBottom = '6px';

    const colourSelect = document.createElement('select');
    colourSelect.style.width = '100%';
    colourSelect.style.marginBottom = '12px';

    const colours = getColourValues();
    if (colours.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No colours found';
        colourSelect.appendChild(opt);
    } else {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '-- Select Colour --';
        colourSelect.appendChild(defaultOpt);

        colours.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            colourSelect.appendChild(opt);
        });
    }
    colourLabel.appendChild(colourSelect);
    content.appendChild(colourLabel);

    // Youth dropdown
    const youthLabel = document.createElement('label');
    youthLabel.textContent = 'Category: ';
    youthLabel.style.display = 'block';
    youthLabel.style.marginBottom = '6px';

    const youthSelect = document.createElement('select');
    youthSelect.style.width = '100%';
    youthSelect.style.marginBottom = '12px';

    [
        { text: 'All', value: 'all' },
        { text: 'Youth (include)', value: 'includeYouth' },
        { text: 'Adult (exclude Youth)', value: 'excludeYouth' },
    ].forEach(({ text, value }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = text;
        youthSelect.appendChild(opt);
    });
    youthLabel.appendChild(youthSelect);
    content.appendChild(youthLabel);

    // Select button
    const selectBtn = document.createElement('button');
    selectBtn.textContent = 'Select';
    selectBtn.style.width = '100%';
    selectBtn.style.padding = '8px';
    selectBtn.style.marginBottom = '8px';
    selectBtn.style.cursor = 'pointer';
    selectBtn.style.background = '#0a84ff';
    selectBtn.style.border = 'none';
    selectBtn.style.borderRadius = '4px';
    selectBtn.style.color = '#fff';
    selectBtn.style.fontWeight = 'bold';

    selectBtn.onclick = () => {
        const colourVal = colourSelect.value;
        if (!colourVal) {
            // alert('Please select a colour.');
            return;
        }

        const categoryVal = youthSelect.value;
        let partialInclude = [colourVal];
        let partialExclude = null;

        if (categoryVal === 'includeYouth') {
            partialInclude.push('Youth');
        } else if (categoryVal === 'excludeYouth') {
            partialExclude = 'Youth';
        }

        const matched = setCheckboxesByLabelValue(partialInclude, partialExclude, true);
        // alert(`Selected ${matched.length} matching checkboxes.`);
    };

    content.appendChild(selectBtn);

    // Find the bulk update button
    const bulkUpdateBtn = document.querySelector('[data-test-editable-variation-bulk-update-images]');

    if (bulkUpdateBtn) {
        const updateBtn = document.createElement('button');
        updateBtn.textContent = "Update 'em";
        updateBtn.style.width = '100%';
        updateBtn.style.padding = '8px';
        updateBtn.style.marginBottom = '16px';
        updateBtn.style.cursor = 'pointer';
        updateBtn.style.background = '#28a745';
        updateBtn.style.border = 'none';
        updateBtn.style.borderRadius = '4px';
        updateBtn.style.color = '#fff';
        updateBtn.style.fontWeight = 'bold';

        updateBtn.onclick = () => {
            bulkUpdateBtn.click();
        };

        // Insert it below the Select button
        content.insertBefore(updateBtn, content.children[content.children.indexOf(selectBtn) + 1]);
    }

    // Weight input
    const weightLabel = document.createElement('label');
    weightLabel.textContent = 'Weight: ';
    weightLabel.style.display = 'block';
    weightLabel.style.marginBottom = '6px';

    const weightInput = document.createElement('input');
    weightInput.type = 'text';
    weightInput.placeholder = 'Enter weight';
    weightInput.style.width = '100%';
    weightInput.style.marginBottom = '12px';
    weightInput.style.padding = '6px';
    weightInput.style.borderRadius = '4px';
    weightInput.style.border = '1px solid #ccc';
    weightLabel.appendChild(weightInput);
    content.appendChild(weightLabel);

    // Weight button
    const weightBtn = document.createElement('button');
    weightBtn.textContent = 'Set Weight';
    weightBtn.style.width = '100%';
    weightBtn.style.padding = '8px';
    weightBtn.style.cursor = 'pointer';
    weightBtn.style.background = '#0a84ff';
    weightBtn.style.border = 'none';
    weightBtn.style.borderRadius = '4px';
    weightBtn.style.color = '#fff';
    weightBtn.style.fontWeight = 'bold';

    weightBtn.onclick = () => {
        const weightVal = weightInput.value.trim();
        if (!weightVal) {
            // alert('Please enter a weight value.');
            return;
        }
        setWeightInputs(weightVal);
        // alert('Weight inputs updated.');
    };

    content.appendChild(weightBtn);

    panel.appendChild(content);
    document.body.appendChild(panel);
}

function deletePanel() {
    const panel = document.getElementById('custom-automation-panel');
    if (panel) {
        panel.remove();
    }
}

createPanel();
