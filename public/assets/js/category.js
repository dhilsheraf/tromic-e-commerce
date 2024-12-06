const searchInput = document.getElementById("search-input");
const rows = document.querySelectorAll(".table-row");
const entriesSelect = document.getElementById("entries-select");
let entriesPerPage = parseInt(entriesSelect.value);

searchInput.addEventListener("input", filterTable);


entriesSelect.addEventListener("change", function () {
    entriesPerPage = parseInt(entriesSelect.value);
    displayRows();
});


function filterTable() {
    const searchText = searchInput.value.toLowerCase();

    rows.forEach(row => {
        const cells = row.getElementsByTagName("td");
        let match = false;

        for (let cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchText)) {
                match = true;
                break;
            }
        }

        row.style.display = match ? "" : "none";
    });

    displayRows();
}


function displayRows() {
    const visibleRows = Array.from(rows).filter(row => row.style.display !== "none");

    const totalPages = Math.ceil(visibleRows.length / entriesPerPage);
    let currentPage = 1;

    visibleRows.forEach((row, index) => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = currentPage * entriesPerPage;

        // Show rows within the page range
        row.style.display = (index >= startIndex && index < endIndex) ? "" : "none";
    });
}


displayRows();


// Select all category status buttons
const statusButtons = document.querySelectorAll('.status-btn');

statusButtons.forEach(button => {
    button.addEventListener('click', async function () {
        const categoryId = this.getAttribute('data-category-id');
        const buttonText = this.textContent.trim();

        try {

            const response = await fetch(`/admin/category/${categoryId}/toggle-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                // Update the button text based on the response
                const data = await response.json();
                this.textContent = data.status === 'Active' ? 'Deactivate' : 'Activate';
            } else {
                const errorData = await response.text();
                console.error('Error response:', errorData)
                alert('Failed to update category status');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }
    });
});

// Change entries limit and reload the page
function changeEntriesLimit(select) {
    const limit = select.value;
    const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
    window.location.href = `?page=${currentPage}&limit=${limit}`;
}

// Search functionality
function searchCategory() {
    const searchValue = document.getElementById("search-input").value.toLowerCase();

    const rows = document.querySelectorAll(".table-row");
    rows.forEach((row) => {
        const cells = row.getElementsByTagName("td");
        let isMatch = Array.from(cells).some((cell) =>
            cell.textContent.toLowerCase().includes(searchValue)
        );
        row.style.display = isMatch ? "" : "none";
    });
}
