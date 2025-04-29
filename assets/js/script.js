/*---------------------------------------
  OWL CAROUSEL (HOME)           
-----------------------------------------*/

// Reusable function to initialize Owl Carousel
function initializeOwlCarousel(selector) {
    // Ensure we destroy the existing instance and reinitialize
    $(selector).trigger('destroy.owl.carousel');

    // Reinitialize Owl Carousel
    $(selector).owlCarousel({
        loop: true, // Enable looping
        autoplay: true,
        autoplayhoverpause: true,
        lazyLoad: true,
        nav: true,
        autoplaytimeout: 100,
        margin: 5,
        padding: 5,
        stagePadding: 5,
        responsive: {
            0: {
                items: 1,
                dots: false
            },
            728: {
                items: 2,
                dots: false
            },
            960: {
                items: 3,
                dots: false
            },
            1200: {
                items: 4,
                dots: true
            }
        }
    });
}

async function displayOwlFeaturedEventsData() {
    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data

        let output = "";

        // Check if the array exists and loop through each event in the array
        if (Array.isArray(data.events)) {

            // 1. Sort events by date (newest first)
            let sortedEvents = sortByTimestamp(data.events);

            // 2. Take only the top 9 most recent events
            let recentEvents = sortedEvents.slice(0, 9);

            recentEvents.forEach(event => {
                output += `
                        <div class="ms-2 me-2 recent_event">
                            <a href="${event.url}" class="d-block card-wrap" target="_blank">  
                                <div class="card">
                                    <img data-src="${event.image}" alt="${event.title}" class="event-card-img-top owl-lazy">
                                    <div class="event-card-body">
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

        // Insert the generated HTML into the container
        document.getElementById("events-container").innerHTML = output;

        // Re-initialize Owl Carousel on the newly added elements
        initializeOwlCarousel(".owl-carousel");
    } catch (error) {
        console.error('Error fetching JSON data:', error);
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

    currentfilterValue = filterValue;

    // Remove 'selected' class from all tags and reset background
    filterTags.forEach(tag => tag.classList.remove('selected'));

    // Add 'selected' class to the clicked tag to highlight it
    tag.classList.add('selected');

    // Pass the tag so it can display on the screen based on filtered tag
    displayFilteredEventsData(filterValue);
}
/*---------------------------------------
  SORT              
-----------------------------------------*/
let isDescending = true; // Default is descending order

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

    displayFilteredEventsData(currentfilterValue);
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

async function displayFilteredEventsData(filterValue) {
    try {
        const response = await fetch('./assets/data/data.json'); // Fetch data from the JSON file
        const data = await response.json(); // Parse the JSON data
        currentFilterValue = filterValue; // Access globally

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

        // Pagination - calculate start and end for the page
        const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage;
        const eventsToDisplay = filteredEvents.slice(startIndex, endIndex);

        let output = "";
        // Check if the array exists and loop through each event in the array
        eventsToDisplay.forEach(event => {
            output += `
                        <div class="col-12 col-sm-6 col-md-4 col-xl-4 filtered_event">
                            <a href="${event.url}" class="d-block card-wrap" target="_blank">  
                                <div class="card">
                                    <img data-src="${event.image}" alt="${event.title}" class="event-card-img-top">
                                    <div class="event-card-body">
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
        generatePagination(filteredEvents.length, totalPages);

        // Manually set the src attribute for images to ensure they load
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.setAttribute('src', dataSrc);  // Set the src to the actual image source
                img.removeAttribute('data-src');  // Remove data-src to clean up
            }
        });
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}
/*---------------------------------------
  PAGINATION (EVENTS)              
-----------------------------------------*/
function generatePagination(totalItems, totalPages) {
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
                displayFilteredEventsData(currentFilterValue);
            }
        });
    });

    // Set event listener for First page button
    document.getElementById('firstPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage !== 1) {
            currentPage = 1;
            displayFilteredEventsData(currentFilterValue);
        }
    });

    // Set event listener for Previous button
    document.getElementById('prevPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayFilteredEventsData(currentFilterValue);
        }
    });

    // Set event listener for Next button
    document.getElementById('nextPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayFilteredEventsData(currentFilterValue);
        }
    });

    // Set event listener for Last page button
    document.getElementById('lastPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage !== totalPages) {
            currentPage = totalPages;
            displayFilteredEventsData(currentFilterValue);
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

        // Manually set the src attribute for images to ensure they load
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.setAttribute('src', dataSrc);  // Set the src to the actual image source
                img.removeAttribute('data-src');  // Remove data-src to clean up
            }
        });
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
                <img data-src="${member.image}" alt="${member.name}" class="event-card-img-top">
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
function initEventsBackground() {
    const header = document.getElementById('events-site-header');
    if (!header) return;

    const bg = header.getAttribute('data-bg');
    if (bg) {
        header.style.background = `
            linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0) 100%),
            url('${bg}')
        `;
        header.style.backgroundSize = "cover";
        header.style.backgroundPosition = "center calc(100% - 100px)";
        header.style.backgroundRepeat = "no-repeat";
        header.style.backgroundAttachment = "fixed";
    }
}
function initHallOfFameBackground() {
    const header = document.getElementById('hof-site-header');
    if (!header) return;

    const bg = header.getAttribute('data-bg');
    if (bg) {
        header.style.background = `
            linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0) 100%),
            url('${bg}')
        `;
        header.style.backgroundSize = "cover";
        header.style.backgroundPosition = "center calc(100% - 145px)";
        header.style.backgroundRepeat = "no-repeat";
        header.style.backgroundAttachment = "fixed";
    }
}

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



window.onload = function () {
    // Home section
    displayOwlFeaturedEventsData();
    // Events section
    InitFiltersData();
    initEventsBackground();
    initHallOfFameBackground();
    // Hall Of Fame section
    InitSemestersData();
    // Initialize the modal system (Hall Of Fame)
    initModal();
    initHippoBackground();
};
