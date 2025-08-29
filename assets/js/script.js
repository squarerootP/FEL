/*---------------------------------------
  SORT (HOME, EVENTS)              
-----------------------------------------*/
let isDescending = true; // Default is descending order
let currentViewMode = 'filter'; // or 'search'

// Function to convert human-readable date to Unix timestamp
function getTimestamp(dateString) {
    return new Date(dateString).getTime();
}

function sortByTimestamp(events) {
    if (isDescending) {
        // Sort events by date (descending order)
        return events.sort((a, b) => getTimestamp(b.date) - getTimestamp(a.date));
    } else {
        // Sort events by date (ascending order)
        return events.sort((a, b) => getTimestamp(a.date) - getTimestamp(b.date));
    }
}

function toggleSort() {
    const sortIcon = document.querySelector('.sort-icon i');

    if (isDescending) {
        sortIcon.classList.remove('fa-sort-down');
        sortIcon.classList.add('fa-sort-up');
    } else {
        sortIcon.classList.remove('fa-sort-up');
        sortIcon.classList.add('fa-sort-down');
    }

    isDescending = !isDescending; // Toggle the sorting state

    if (currentViewMode === 'search') {
        displaySearchedEventsData();
    } else {
        displayFilteredEventsData(currentFilterValue);
    }
}
/*---------------------------------------
  RECENT EVENTS (HOME)        
-----------------------------------------*/
async function displayRecentEventsData() {
    try {
        const response = await fetch('./assets/data/data.json');
        const data = await response.json();

        let output = "";

        if (Array.isArray(data.events)) {
            const sortedEvents = sortByTimestamp(data.events);
            const recentEvents = sortedEvents.slice(0, 4); // Show only 4

            recentEvents.forEach(event => {
                output += `
                    <div class="col-12 col-sm-6 col-lg-3 d-flex mb-4">
                        <a href="${event.url}" class="card-wrap d-flex w-100" target="_blank">  
                            <div class="card h-100 w-100 d-flex flex-column">
                                <img data-src="${event.image}" alt="${event.title}" class="event-card-img-top lazyload">
                                <div class="event-card-body flex-grow-1">
                                    <h5 class="card-title">${event.title}</h5>
                                    <p>${event.description}</p>
                                    <span>${event.tag}</span>
                                    <span>(${event.date})</span>
                                </div>
                            </div>
                            <div class="hover-tooltip">Click to view ${event.url}</div> <!-- Add this -->
                        </a>
                    </div>
                `;
            });
        }

        document.getElementById("events-container").innerHTML = `
            <div class="row justify-content-center">${output}</div>
        `;

    } catch (error) {
        console.error('Error fetching or displaying recent events:', error);
    }
}

/*---------------------------------------
  FILTER (EVENTS)        
-----------------------------------------*/
let currentfilterValue = ""; // Global access variable

// Function to apply the content filter
function applyFilter(tag) {
    const filterValue = tag.getAttribute('data-filter'); // Get the selected filter value
    const filterTags = document.querySelectorAll('.filter_tag');

    // Only clear search and date input values, not filter tags
    clearSearchInputs(); // Compatiable with displaySearchedEventsData

    currentfilterValue = filterValue;

    // Remove 'selected' class from all tags and reset background
    filterTags.forEach(tag => tag.classList.remove('selected'));

    // Add 'selected' class to the clicked tag to highlight it
    tag.classList.add('selected');

    // Pass the tag so it can display on the screen based on filtered tag
    initDisplayFilteredEventsData(filterValue);
}

function removeSelectedTag() {
    const filterTags = document.querySelectorAll('.filter_tag'); // Select all tags
    filterTags.forEach(tag => tag.classList.remove('selected')); // Remove 'selected' from each
}
/*---------------------------------------
  FILTERED EVENTS (EVENTS)              
-----------------------------------------*/
let currentFilterValue = ''; // Store the filter value in a variable to access globally

async function InitFiltersData() {
    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data

        let output = "";

        output += '';

        // Check if the array exists and loop through each event in the array
        if (Array.isArray(data.filterEvents)) {

            output += `
                        <div class="filter_tag" data-filter="all" onclick="applyFilter(this)">
                                                    All</div>
                    `; // 'All' will always be initilized

            data.filterEvents.forEach(filter => {
                // Capitalize the first letter of the filter tag and keep the rest of the string as is
                const capitalizedTag = filter.tag.charAt(0).toUpperCase() + filter.tag.slice(1);

                output += `
                        <div class="filter_tag" data-filter="${filter.tag}" onclick="applyFilter(this)">
                                                    ${capitalizedTag}</div>
                    `;
            });
        }

        // Insert the generated HTML into the container
        document.getElementById("filter_group").innerHTML = output;

        // Apply the "All" filter after filters are loaded
        const allFilterTag = document.querySelector('.filter_tag[data-filter="all"]');
        if (allFilterTag) {
            applyFilter(allFilterTag); // Apply the "All" filter
        }
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}

let currentPage = 1; // Start with the first page
let itemsPerPage = 6; // Number of items to show per page

async function initDisplayFilteredEventsData(filterValue) {
    currentPage = 1; // Restart at the first page
    displayFilteredEventsData(filterValue);
}

async function displayFilteredEventsData(filterValue) {
    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data
        currentFilterValue = filterValue; // Access globally

        currentViewMode = 'filter' // Tell the global variable that the sort will be calling filter instead

        let filteredEvents = [];

        // Check if the array exists and loop through each event in the array
        if (Array.isArray(data.events)) {
            if (filterValue === 'all') { // If 'All' is being chosen instead
                filteredEvents = data.events;
            } else {
                // Filter events by the selected filter (e.g, featured)
                filteredEvents = data.events.filter(event => event.tag == filterValue);
            }
        }

        // Sort the filtered events by date (ascending or descending)
        filteredEvents = sortByTimestamp(filteredEvents);

        // When the filtered result is empty
        if (filteredEvents.length === 0) {
            document.getElementById("filtered_events_group").innerHTML = `
                <div class="col-12">
                    <h3 style="color: var(--primary-color);">No events found for this filter.</h3>
                </div>
            `;
            document.getElementById("pagination").innerHTML = ""; // Clear pagination
            return; // Stop further execution
        }

        // Pagination - calculate start and end for the page
        const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage;
        const eventsToDisplay = filteredEvents.slice(startIndex, endIndex);

        let output = "";
        // Check if the array exists and loop through each event in the array
        eventsToDisplay.forEach(event => {
            output += `
                        <div class="col-12 col-sm-6 col-lg-4 d-flex mb-4">
                            <a href="${event.url}" class="card-wrap d-flex w-100" target="_blank">  
                                <div class="card h-100 w-100 d-flex flex-column">
                                    <img data-src="${event.image}" alt="${event.title}" class="event-card-img-top lazyload">
                                    <div class="event-card-body flex-grow-1">
                                        <h5 class="card-title">${event.title}</h5>
                                        <p>${event.description}</p>
                                        <span>${event.tag}</span>
                                        <span>(${event.date})</span>
                                    </div>
                                </div>
                                <div class="hover-tooltip">Click to view ${event.url}</div> <!-- Add this -->
                            </a>
                        </div>
                    `;
        });

        // Insert the generated HTML into the container
        document.getElementById("filtered_events_group").innerHTML = output;

        // Generate Pagination Buttons
        generatePagination(filteredEvents.length, totalPages, () => displayFilteredEventsData(filterValue));
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}

async function displaySearchedEventsData() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    // Check if both dates are valid and the range is logical
    if (startDateInput && endDateInput && startDate > endDate) {
        alert("⚠️ The end date must be after the start date.");
        return;
    }

    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data

        currentViewMode = 'search' // Tell the global variable that the sort will be calling filter instead

        // Normalize search
        const keyword = searchTerm.trim().toLowerCase();
        let matchedEvents = [];

        // Check if the array exists and loop through each event in the array
        if (Array.isArray(data.events)) {
            matchedEvents = data.events.filter(event => {
                const titleMatch = event.title.toLowerCase().includes(searchTerm);

                const eventDate = new Date(event.date);
                const dateMatch = (!isNaN(startDate) ? eventDate >= startDate : true) &&
                    (!isNaN(endDate) ? eventDate <= endDate : true);

                return titleMatch && dateMatch;
            });
        }

        // Sort the filtered events by date (ascending or descending)
        matchedEvents = sortByTimestamp(matchedEvents);

        // When the filtered result is empty
        if (matchedEvents.length === 0) {
            document.getElementById("filtered_events_group").innerHTML = `
                        <div class="col-12">
                            <h3 style="color: var(--primary-color);">No events found for this search.</h3>
                        </div>
                    `;
            document.getElementById("pagination").innerHTML = ""; // Clear pagination
            return; // Stop further execution
        }

        // Pagination - calculate start and end for the page
        const totalPages = Math.ceil(matchedEvents.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage;
        const eventsToDisplay = matchedEvents.slice(startIndex, endIndex);

        let output = "";
        // Check if the array exists and loop through each event in the array
        eventsToDisplay.forEach(event => {
            output += `
                        <div class="col-12 col-sm-6 col-lg-4 d-flex mb-4">
                            <a href="${event.url}" class="card-wrap d-flex w-100" target="_blank">  
                                <div class="card h-100 w-100 d-flex flex-column">
                                    <img data-src="${event.image}" alt="${event.title}" class="event-card-img-top lazyload">
                                    <div class="event-card-body flex-grow-1">
                                        <h5 class="card-title">${event.title}</h5>
                                        <p>${event.description}</p>
                                        <span>${event.tag}</span>
                                        <span>(${event.date})</span>
                                    </div>
                                </div>
                                <div class="hover-tooltip">Click to view ${event.url}</div> <!-- Add this -->
                            </a>
                        </div>
                    `;
        });

        removeSelectedTag(); // Remove all selected tag first
        // Insert the generated HTML into the container
        document.getElementById("filtered_events_group").innerHTML = output;

        // Generate Pagination Buttons
        generatePagination(matchedEvents.length, totalPages, displaySearchedEventsData);
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}

function clearAllFilters() {
    // Clear all input fields
    document.getElementById('searchInput').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';

    // Optionally, blur and refocus to reset browser autofill style (especially for text input)
    document.getElementById('searchInput').blur();
    document.getElementById('searchInput').focus();

    document.getElementById('startDate').blur();
    document.getElementById('endDate').blur();

    // Clear any validation or error messages
    document.getElementById('errorMessage').textContent = '';

    // Reload full list or reset the filtered display
    currentPage = 1;
    // Apply the "All" filter after filters are loaded
    const allFilterTag = document.querySelector('.filter_tag[data-filter="all"]');
    if (allFilterTag) {
        applyFilter(allFilterTag); // Apply the "All" filter
    }
}

function clearSearchInputs() {
    document.getElementById('searchInput').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
}
/*---------------------------------------
  PAGINATION (EVENTS)              
-----------------------------------------*/
function generatePagination(totalItems, totalPages, updateFunction) {
    const pagination = document.getElementById('pagination');
    let paginationHTML = '';

    // Clear the previous pagination HTML
    pagination.innerHTML = '';

    // First page Button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}" id="firstPage">
            <a class="page-link" href="#" aria-label="First Page">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Previous Button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}" id="prevPage">
            <a class="page-link" href="#" aria-label="Previous">
                <span aria-hidden="true">&lsaquo;</span>
            </a>
        </li>
    `;

    // Page Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link page-link-number" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Next Button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}" id="nextPage">
            <a class="page-link" href="#" aria-label="Next">
                <span aria-hidden="true">&rsaquo;</span>
            </a>
        </li>
    `;

    // Last page Button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}" id="lastPage">
            <a class="page-link" href="#" aria-label="Last Page">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    // Insert the updated pagination HTML into the container
    pagination.innerHTML = paginationHTML;

    // Set event listeners for page numbers
    document.querySelectorAll('.page-link-number').forEach(pageLink => {
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            const newPage = parseInt(pageLink.dataset.page);
            if (newPage !== currentPage) {
                currentPage = newPage;
                updateFunction(); // use callback
            }
        });
    });

    // Set event listener for First page button
    document.getElementById('firstPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage !== 1) {
            currentPage = 1;
            updateFunction(); // use callback
        }
    });

    // Set event listener for Previous button
    document.getElementById('prevPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            updateFunction(); // use callback
        }
    });

    // Set event listener for Next button
    document.getElementById('nextPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            updateFunction(); // use callback
        }
    });

    // Set event listener for Last page button
    document.getElementById('lastPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage !== totalPages) {
            currentPage = totalPages;
            updateFunction(); // use callback
        }
    });
}
/*---------------------------------------
  FILTERED MEMEBER (HALL OF FAME)              
-----------------------------------------*/
async function InitSemestersData() {
    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data

        let output = '<option value="none" selected>&lt;&lt;None specify&gt;&gt;</option>';

        // Check if the array exists and loop through each event in the array
        if (Array.isArray(data.semesters)) {
            data.semesters.forEach(semester => {
                // Capitalize the first letter of the semester tag and keep the rest of the string as is
                const capitalizedSemester = semester.semester.toUpperCase();

                output += `
                        <option value="${capitalizedSemester}">${capitalizedSemester}</option>
                    `;
            });
        }

        // Insert the generated HTML into the container
        document.getElementById("semester-select").innerHTML = output;

        // Automatically select "None specify" when the page loads (no need for additional logic)
        displayMembersBySemesterData({ target: { value: "none" } }); // Trigger default behavior for "None specify"
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}

async function displayMembersBySemesterData(event) {
    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data

        const selectedSemester = event.target.value;  // Get the value of the selected option

        // If "none" is selected, display the message and return immediately
        if (selectedSemester === "none") {
            document.getElementById("semester-executive_boards").innerHTML = "Please choose a semester";
            document.getElementById("semester-club_member").innerHTML = "Please choose a semester";
            return; // Exit the function early
        }

        // Filter out the executive board members and display it
        let filteredExecutiveBoardMembers = [];
        // Check if the array exists and loop through each member in the array
        if (Array.isArray(data.honorableExecutiveBoardMembers)) {
            // Filter members by the selected semester
            filteredExecutiveBoardMembers = data.honorableExecutiveBoardMembers.filter(member => {
                // Split the semester string into an array of semesters
                const semesters = member.semester.split(',');

                // Check if the selectedSemester exists in the semesters array
                return semesters.includes(selectedSemester);
            });
        }
        let outputExecutiveBoardMembers = "";
        // Check if the array exists and loop through each event in the array
        filteredExecutiveBoardMembers.forEach(member => {
            outputExecutiveBoardMembers += createMemberCard(member);
        });
        // Insert the generated HTML into the container
        document.getElementById("semester-executive_boards").innerHTML = outputExecutiveBoardMembers;

        // Filter out the club members and display it
        let filteredClubMembers = [];
        // Check if the array exists and loop through each member in the array
        if (Array.isArray(data.honorableClubMembers)) {
            // Filter members by the selected semester
            filteredClubMembers = data.honorableClubMembers.filter(member => {
                // Split the semester string into an array of semesters
                const semesters = member.semester.split(',');

                // Check if the selectedSemester exists in the semesters array
                return semesters.includes(selectedSemester);
            });
        }
        let outputClubMembers = "";
        // Check if the array exists and loop through each event in the array
        filteredClubMembers.forEach(member => {
            outputClubMembers += createMemberCard(member);
        });
        // Insert the generated HTML into the container
        document.getElementById("semester-club_member").innerHTML = outputClubMembers;
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}
/*---------------------------------------
  MODAL MEMBER (HALL OF FAME)              
-----------------------------------------*/
// When you build member cards, add data-* attributes
function createMemberCard(member) {
    return `
    <div class="col-6 col-sm-6 col-md-4 col-lg-2 col-xl-2 mt-1 mb-4 me-4">
        <div class="member-card-wrap">
            <div class="member-card" 
                data-name="${member.name || ''}"
                data-role="${member.role || ''}"
                data-image="${member.image || ''}"
                data-achievements="${member.achievements || ''}"
                data-contributions="${member.contributions || ''}"
                data-background="${member.background || ''}">
                <img data-src="${member.image}" alt="${member.name}" class="event-card-img-top lazyload">
                <div class="member-role">
                    <span>${member.role}</span>
                </div>
            </div>
            <div class="member-name">
                <p>${member.name}</p>
            </div>
        </div>
    </div>`;
}

function initModal() {
    const modal = document.getElementById('memberModal');
    const modalCloseBtn = modal.querySelector('.modal-close');

    // Click any member card
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.member-card');
        if (card) {
            openMemberModal(card);
        }
    });

    // Click close button
    modalCloseBtn.addEventListener('click', function () {
        closeModal();
    });

    // Click outside modal-content
    window.addEventListener('click', function (e) {
        if (e.target.id === 'memberModal') {
            closeModal();
        }
    });

    function openMemberModal(card) {
        document.getElementById('modalMemberName').textContent = card.dataset.name || "N/A";
        document.getElementById('modalMemberRole').textContent = card.dataset.role || "N/A";
        document.getElementById('modalMemberImage').src = card.dataset.image || "";

        document.getElementById('modalMemberAchievements').textContent = card.dataset.achievements || "N/A";
        document.getElementById('modalMemberContributions').textContent = card.dataset.contributions || "N/A";
        document.getElementById('modalMemberBackground').textContent = card.dataset.background || "N/A";

        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }
}
/*---------------------------------------
  BANNER (EVENTS)              
-----------------------------------------*/
function initSectionBackground(headerId) {
    const header = document.getElementById(headerId);
    if (!header) return;

    const bg = header.getAttribute('data-bg');
    if (!bg) return;

    header.style.background = `
        linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0) 100%),
        url('${bg}')
    `;
    header.style.backgroundSize = "cover";
    header.style.backgroundPosition = "center center";
    header.style.backgroundRepeat = "no-repeat";
    header.style.backgroundAttachment = "scroll";
}

function initMainBackground(headerId) {
    const header = document.getElementById(headerId);
    if (!header) return;

    const bg = header.getAttribute('data-bg');
    if (!bg) return;

    header.style.background = `
        linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0) 100%),
        url('${bg}')
    `;
    header.style.backgroundSize = "cover";
    header.style.backgroundPosition = "center center";
    header.style.backgroundRepeat = "no-repeat";
    header.style.backgroundAttachment = "fixed";
}

/*---------------------------------------
  MEMBER (HALL OF FAME)              
-----------------------------------------*/
function initMemberBackground(config = { width: '130vh', height: '70vh', opacity: 0.3 }) {
    const header = document.getElementById('modal-content');
    if (!header) return;

    const bg = header.getAttribute('data-bg');
    if (bg) {
        // Setup container
        header.style.position = 'relative';
        header.style.overflow = 'hidden';

        // Remove existing image if any
        let bgImage = header.querySelector('.background-image');
        if (!bgImage) {
            bgImage = document.createElement('img');
            bgImage.className = 'background-image';
            header.prepend(bgImage);
        }

        // Set image source
        bgImage.src = bg;

        // Apply consistent styles
        Object.assign(bgImage.style, {
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: config.width,
            height: config.height,
            objectFit: 'contain', // force image to fit inside box
            opacity: config.opacity,
            zIndex: 0,
            pointerEvents: 'none',
        });

        // Content above
        header.querySelectorAll('*').forEach(el => {
            if (el !== bgImage) {
                el.style.position = 'relative';
                el.style.zIndex = 1;
            }
        });
    }
}

async function initHippoBackground() {
    try {
        const response = await fetch('./assets/data/data.json');
        const data = await response.json();

        const bgImage = data.hippo.image; // image path from JSON
        const modalContent = document.getElementById("modal-content");

        if (modalContent && bgImage) {
            modalContent.setAttribute("data-bg", bgImage);
        }

        initMemberBackground();

    } catch (error) {
        console.error('Error setting background from JSON:', error);
    }
}

function copyEmail() {
    navigator.clipboard.writeText("fel.daihocfptcantho@gmail.com")
        .then(() => alert("Email copied to clipboard!"))
        .catch(() => alert("Failed to copy email."));
}



window.onload = function () {
    if (window.location.pathname.endsWith("events.html")) {
        InitFiltersData();
        initSectionBackground('events-site-header', 60, 100, 220, 200, 200, 200);
        document.getElementById("searchButton").addEventListener("click", function () {
            const searchValue = document.getElementById("searchInput").value.trim();
            displaySearchedEventsData(searchValue);
        });
        document.getElementById('clearButton').addEventListener('click', () => {
            clearAllFilters()
        });
    }
    else
        if (window.location.pathname.endsWith("hall-of-fame.html")) {
            initSectionBackground('hof-site-header', 130, 100, 220, 200, 200, 220);
            InitSemestersData();
            initModal();
            initHippoBackground();
        } else
            if (window.location.pathname.endsWith("about.html")) {
                initSectionBackground('about-site-header', 90, 100, 140, 160, 160, 160);
            } else
                if (window.location.pathname.endsWith("faq.html")) {
                    initSectionBackground('faq-site-header', 0, 200, 140, 160, 160, 160);
                } else
                    if (window.location.pathname.endsWith("contact.html")) {
                        initSectionBackground('contact-site-header', 0, 180, 140, 90, 90, 90);
                    } else
                        if (window.location.pathname.endsWith("developer.html")) {
                            initSectionBackground('developer-site-header', 20, 130, 130, 90, 150, 165);
                            initSectionBackground('developer', 0);
                        } else {
                            displayRecentEventsData();
                        }
    initMainBackground('main-background', 0);
};
