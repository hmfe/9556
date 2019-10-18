var teams = [];
var events = [];

const API_URL = 'https://www.thesportsdb.com/api/v1/json/1/';
const searchResultListNode = document.getElementById('searchResultList');
const inputNode = document.getElementById('teamSearch');
const searchHistoryNode = document.getElementById('searchHistoryList');
const eventListNode = document.getElementById('eventList');

function formatDate() {
    const date = new Date();

    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
}

function resetAutoComplete() {
    searchResultListNode.style.display = 'none';
    searchResultListNode.innerHTML = '';
    teams = [];
}

function appendSearchHistoryItem(team) {
    const node = document.createElement('li');
    node.id = team.id;
    
    const teamName = document.createElement('span');
    teamName.innerHTML = team.teamName;
    const date = document.createElement('span');
    date.innerHTML = formatDate();
    const button = document.createElement('button');
    button.innerHTML = '&#215;';
    button.setAttribute('aria-label', 'Clear item from search history');
    
    node.appendChild(teamName);
    node.appendChild(date);
    node.appendChild(button);
    
    button.addEventListener('click', () => document.getElementById(team.id).remove());
    
    searchHistoryNode.append(node);
    searchHistoryNode.style.display = 'block';
    inputNode.value = '';
    resetAutoComplete();
}

function appendEventItems() {
    eventListNode.innerHTML = '';

    if(events.events) {
        events.events.forEach(event => {
            const htmlString =
            `<section>
                <div>
                    <span>${event.dateEvent}</span>
                    <span>${event.strTime.split('+')[0]}</span>
                </div>
                <div>
                    <h1>${event.strEvent}</h1>
                    <span>${event.strSport} - ${event.strLeague}</span>
                    <span>Home Team: ${event.strHomeTeam}</span>
                    <span>Away Team: ${event.strAwayTeam}</span>
                </div>
            </section>`;
            
            eventListNode.innerHTML += htmlString;
        });
    } else {
        const node = document.createElement('section');
        const heading = document.createElement('span');
        heading.innerHTML = 'No events found.'
        node.appendChild(heading);
        
        eventListNode.appendChild(node);
    }
}

function appendAutoCompleteItems() {
    searchResultListNode.innerHTML = '';

    teams.forEach(team => {
        const node = document.createElement('li');
        node.innerHTML = team.teamName;

        node.addEventListener('click', async () => {
            appendSearchHistoryItem(team);
            events = await getData('eventsnext.php?id=', team.id);

            appendEventItems();
        });

        searchResultListNode.appendChild(node);
    });
    
    searchResultListNode.style.display = 'block';
}

const debounce = (func, delay) => {
    let debounceTimer 
    return function() { 
        const context = this
        const args = arguments 
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => func.apply(context, args), delay) 
    } 
}

async function getData(method, query) {
    if(query.length < 2) {
        resetAutoComplete();
        return;
    }

    try {
        const url = `${API_URL}${method}${encodeURI(query)}`;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    } catch(err) {
        console.log(err);
    }
}

// Main event handlers.

inputNode.oninput = debounce(async event => {
    // Only accept letters, numbers and spaces.
    var regex = new RegExp('^[A-Za-z0-9 ]*[A-Za-z0-9][A-Za-z0-9 ]*$');
    if(!regex.test(event.target.value)) {
        teams = [];
        return;
    }

    const data = await getData('searchteams.php?t=', event.target.value);

    if(data && data.teams) {
        teams = data.teams.map(team => {
            return {
                id: team.idTeam,
                teamName: team.strTeam 
            };
        });

        appendAutoCompleteItems();
    } else {
        resetAutoComplete();
    }
}, 275);

document.getElementById('clearSearches').addEventListener('click', () => {
    const innerNode = searchHistoryNode;
    innerNode.innerHTML = '';
});

inputNode.addEventListener('focus', () => {
    if(teams.length > 0) {
        searchResultListNode.style.display = 'block';
    }
});

inputNode.addEventListener('blur', () => {
    setTimeout(() => searchResultListNode.style.display = 'none', 250);
});

inputNode.addEventListener('keydown', (e) => {
    if(e.keyCode === 38 || e.keyCode === 40)
        e.preventDefault();
    var x = searchResultListNode.children;
    var l = x.length;
    var index = -1;

    for (i = 0; i < l; i++) {
        if(x[i].className === 'selected') {
            index = i;
        }
    }

    switch(e.keyCode) {
        case 38:
            // Key up.
            if(index > 0) {
                x[index].className = '';
                x[index - 1].className = 'selected'
            }
            return false;
        case 40:
            // Key down.
            if(index + 1 < l) {
                if(index >= 0)
                    x[index].className = '';
                x[index+1].className = 'selected'
            }
            return false;
        case 13:
            // Key enter.
            x[index].click();
            break;
    }
});

