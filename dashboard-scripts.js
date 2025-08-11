function fixWidth() {
    let outerElement = document.getElementsByClassName("edit-sheet-container")[0];
    let innerElement = outerElement.getElementsByClassName("form-fieldset")[0];

    // Remove width: 800px
    outerElement.style.width = "100%";
    outerElement.style.paddingLeft = "2%";
    outerElement.style.paddingRight = "100px";

    // Remove max-width: 800px
    innerElement.style.maxWidth = "100%";
}

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
    if (partialInclude === undefined || partialInclude.length === 0) {
        partialInclude = ['all'];
    }
    if (!Array.isArray(partialInclude) || partialInclude.length === 0) {
        partialInclude = [partialInclude];
    }
    // console.log('partialInclude', partialInclude);

    let labels = Array.from(
        document.querySelectorAll('label[data-test-editable-variation-table-select-variation]')
    );

    labels = labels.filter(label => {
        const val = label.getAttribute('data-test-editable-variation-table-select-variation') || '';
        if (partialInclude.length === 1 && partialInclude[0] === 'all') {
            return true;
        }
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

        if (checked == undefined || checked != checkbox.checked) {
            // console.log('checking', label.textContent, checkbox.checked, checked);
            checkbox.click(); // simulate click to keep Ember happy
        }
    });

    return labels;
}

function setWeightInputs(value) {
    console.log('setWeightInputs', value);
    const containers = document.querySelectorAll(
        '[data-test-editable-variation-table-weight-input-div]'
    );

    // Poll each input after blur until Ember reflects a trailing '0'
    function waitForTrailingZero(inputElement, timeoutMs = 3000, intervalMs = 100) {
        const startTime = Date.now();
        const timerId = setInterval(() => {
            const current = (inputElement.value || '').trim();
            if (current.endsWith('0')) {
                clearInterval(timerId);
                return;
            }
            if (Date.now() - startTime > timeoutMs) {
                clearInterval(timerId);
                // console.warn('Timed out waiting for trailing 0 on weight input:', current);
            }
        }, intervalMs);
    }

    // Parse desired numeric value once
    const desiredNumber = parseFloat(String(value).trim());

    containers.forEach(div => {
        const input = div.querySelector('input');
        if (!input) return;

        // If the current numeric value equals the desired numeric value, skip updating this input
        const currentNumber = parseFloat((input.value || '').trim());
        if (Number.isFinite(currentNumber) && Number.isFinite(desiredNumber) && currentNumber === desiredNumber) {
            return;
        }

        input.focus();
        input.select();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();

        // After blur, poll until the input value ends with '0' (or times out)
        waitForTrailingZero(input);
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

    // Colour dropdown options — add 'All' at top
    const colours = getColourValues();
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'all';   // use 'all' as value here
    defaultOpt.textContent = 'All Colours';
    colourSelect.appendChild(defaultOpt);

    colours.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        colourSelect.appendChild(opt);
    });
    // Wrap colour label/select and refresh button in a row
    const colourRow = document.createElement('div');
    colourRow.style.display = 'flex';
    colourRow.style.alignItems = 'flex-end';
    colourRow.style.gap = '8px';
    // Make label/select take remaining width
    colourLabel.style.flex = '1';
    colourSelect.style.flex = '1';

    // Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '↻';
    refreshBtn.title = 'Refresh colours';
    refreshBtn.style.width = '36px';
    refreshBtn.style.height = '36px';
    refreshBtn.style.marginBottom = '12px';
    refreshBtn.style.cursor = 'pointer';
    refreshBtn.style.background = '#444';
    refreshBtn.style.border = 'none';
    refreshBtn.style.borderRadius = '4px';
    refreshBtn.style.color = '#fff';
    refreshBtn.style.fontWeight = 'bold';

    refreshBtn.onclick = () => {
        const latestColours = getColourValues();
        // Repopulate select with default 'All Colours'
        colourSelect.innerHTML = '';
        const def = document.createElement('option');
        def.value = 'all';
        def.textContent = 'All Colours';
        colourSelect.appendChild(def);
        latestColours.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            colourSelect.appendChild(opt);
        });
    };

    colourLabel.appendChild(colourSelect);
    colourRow.appendChild(colourLabel);
    colourRow.appendChild(refreshBtn);
    content.appendChild(colourRow);

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
        const categoryVal = youthSelect.value;

        let partialInclude = [];
        let partialExclude = null;

        if (colourVal !== 'all' && colourVal !== '') {
            partialInclude.push(colourVal);
        }

        if (categoryVal === 'includeYouth') {
            partialInclude.push('Youth');
        } else if (categoryVal === 'excludeYouth') {
            partialExclude = 'Youth';
        }

        if (partialInclude.length === 0 && !partialExclude) {
            // No filter criteria; maybe alert or just do nothing
            alert('Please select a filter.');
            return;
        }

        selectBtn.disabled = true;
        // Deselect all checkboxes
        setCheckboxesByLabelValue(undefined, undefined, false);
        // Select the checkboxes
        const matched = setCheckboxesByLabelValue(partialInclude, partialExclude, true);
        selectBtn.disabled = false;
        // alert(`Selected ${matched.length} matching checkboxes.`);
    };

    content.appendChild(selectBtn);

    // Bulk update button
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
        // Find the bulk update button
        const bulkUpdateBtn = document.querySelector('[data-test-editable-variation-bulk-update-images]');
        if (bulkUpdateBtn) {
            bulkUpdateBtn.click();
        }
    };

    // Insert it below the Select button
    // content.insertBefore(updateBtn, content.children[content.children.indexOf(selectBtn) + 1]);
    content.appendChild(updateBtn);

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
        weightBtn.textContent = 'Updating...';
        setWeightInputs(weightVal);
        weightBtn.textContent = 'Set Weight';
        // alert('Weight inputs updated.');
    };

    content.appendChild(weightBtn);

    // Fix Width button
    const fixWidthBtn = document.createElement('button');
    fixWidthBtn.textContent = 'Fix Width';
    fixWidthBtn.style.width = '100%';
    fixWidthBtn.style.padding = '8px';
    fixWidthBtn.style.marginTop = '12px';
    fixWidthBtn.style.cursor = 'pointer';
    fixWidthBtn.style.background = '#6c757d';
    fixWidthBtn.style.border = 'none';
    fixWidthBtn.style.borderRadius = '4px';
    fixWidthBtn.style.color = '#fff';
    fixWidthBtn.style.fontWeight = 'bold';
    fixWidthBtn.onclick = () => {
        try { fixWidth(); } catch (e) { console.warn('fixWidth() failed:', e); }
    };
    content.appendChild(fixWidthBtn);

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
