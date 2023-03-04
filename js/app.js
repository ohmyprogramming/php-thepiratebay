/*
 * Copyright (C) 2022 ohmyprogramming <github.com/ohmyprogramming>
 * The Pirate Bay Modern Web App
 */

var app = app ? app : {};

app.config = {};
app.config.ajax_url = "/ajax/proxy.php";

app.input = {};
app.input.page = 1;

app.element = {};
app.element.input = search_container.querySelector(".input");

page_number.innerText = app.input.page;

function show_page_controls() {
    app.element.input.setAttribute("data-page-controls", '1');
}

function hide_page_controls() {
    app.element.input.setAttribute("data-page-controls", '0');
}

function show_results() {
    search_results.setAttribute("data-hidden", '0');
}

function hide_results() {
    search_results.setAttribute("data-hidden", '1');
}

function set_error_html(html_response) {
    error_message.innerHTML = html_response;
}

function show_error() {
    error_message.setAttribute("data-hidden", '0');
}

function hide_error() {
    error_message.setAttribute("data-hidden", '1');
}

function set_error(heading, paragraph) {
    error_message.innerHTML = "<h1>" + heading + "</h1><p>" + paragraph + "</p>";
}

function set_results_html(html_response) {
    search_results.innerHTML = html_response;
}

app.make_clean_table_data = function(old_table) {
    var table_rows = old_table.querySelectorAll("tr");

    var local_table = document.createElement("table");
    var local_thead = document.createElement("thead");
    var local_tbody = document.createElement("tbody");

    local_table.setAttribute("id", "table_data");

    local_thead.innerHTML = `
<tr>
    <td class="w-50">Name</td>
    <td>Uploaded</td>
    <td>Size</td>
    <td>Seeders/Leechers</td>
    <td>Author</td>
    <td>Actions</td>
</tr>
`;

    for (let i = 0, j = table_rows.length; i < j; i++) {
        var table_row = table_rows[i];

        /* Skip the header row */
        if (table_row.className == "header")
            continue;

        /* Skip the footer row containing the page numbers */
        if (table_row.querySelector("td").getAttribute("style") == "text-align:center;")
            continue;

        /* Extract information from TD */
        var table_tds = table_row.querySelectorAll("td");
        var td_name     = table_tds[1].innerText;
        var td_uploaded = table_tds[2].innerText;
        var td_magnet   = table_tds[3].querySelector("a[href^=\"magnet\"]").getAttribute("href");
        var td_size     = table_tds[4].innerText;
        var td_seeders  = table_tds[5].innerText;
        var td_leechers = table_tds[6].innerText;
        var td_author   = table_tds[7].innerText;

        /* Create the appropriate HTML for a table row which we'll append to local_tbody */
        var row = document.createElement("tr");
        var html_buffer = "";
        html_buffer += "<td>" + td_name + "</td>";
        html_buffer += "<td>" + td_uploaded + "</td>";
        html_buffer += "<td>" + td_size + "</td>";
        html_buffer += "<td>" + td_seeders + "/" + td_leechers + "</td>";
        html_buffer += "<td>" + td_author + "</td>";
        html_buffer += "<td><a href=\"" + td_magnet + "\" title=\"Open Magnet Link\"><button class=\"action magnet\"></button></a>" + "</td>";
        row.innerHTML = html_buffer;
        local_tbody.appendChild(row);
    }

    local_table.appendChild(local_thead);
    local_table.appendChild(local_tbody);

    set_results_html(local_table.outerHTML);
}

app.search = function(query = null) {
    if (query == null)
        return;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            /* Create a temporary element, who we'll manipulate a little */
            /* and then write it's innerHTML to the aggregator element.  */
            var response_element = document.createElement("div");
            var html_response = xhr.responseText.toString();
            var is_error = (html_response.substring(0, 17) == "<!--proxyerror-->");

            /* If an error occured on the proxy side, print it out */
            if (is_error == true) {
                /* Show error */
                set_error_html(html_response);
                show_error();

                /* Remove search results */
                set_results_html('');
                hide_results();

                /* Hide page controls */
                hide_page_controls();
                return;
            } else {
                /* Hide error (if previously shown) */
                set_error_html('');
                hide_error();

                /* Show results */
                show_results();
            }

            /* Write the HTML response to an element so we have a DOM to work with */
            response_element.innerHTML = html_response;

            /* Query for the #searchResult table */
            var search_result_table = response_element.querySelector("#searchResult");

            /* TODO: search_result_table not found */
            if (search_result_table == null) {
                // No search table. Print some error
            }

            var results_tbody = search_result_table.querySelector("tbody");
            var has_results = results_tbody != null;

            /* Check that the table has content by querying for tbody */
            if (has_results == true) {
                /* Show page contrls */
                show_page_controls();

                /* Hide error */
                set_error_html('');
                hide_error();

                /* Finally write the search_result_table HTML to the #search_results div */
                app.make_clean_table_data(search_result_table);
                show_results();
            } else {
                /* Show error */
                set_error("Error", "Table returned no results.");
                show_error();

                /* Remove page results */
                set_results_html('');
                hide_results();
            }
        }
    }

    var xhr_url = app.config.ajax_url + "?search=" + query + "&page=" + app.input.page;

    xhr.open("GET", xhr_url);
    xhr.send();
}

search_button.addEventListener("click", function(evt) {
    var query = search_input.value.trim().toString();

    if (query.length == 0)
        return;

    app.search(query);
});

search_input.addEventListener("keyup", function(evt) {
    if (evt.keyCode == 13) { /* Enter */
        var query = search_input.value.trim().toString();

        if (query.length == 0)
            return;

        app.search(query);
    }
});

page_decrease.addEventListener("click", function(evt) {
    var page = parseInt(page_number.innerText);

    if (page == 1)
        return;

    setPageNumber(page - 1);
});

page_increase.addEventListener("click", function(evt) {
    var page = parseInt(page_number.innerText);

    if (page == 999)
        return;

    setPageNumber(page + 1);
});

page_number.addEventListener("keydown", function(evt) {
    if (evt.keyCode == 13) { /* Enter */
        page_number.dispatchEvent(
            new Event("focusout")
        );
    }

    /* Number row, numpad and backspace only */
    if (!(evt.keyCode > 47 && 59 > evt.keyCode) && evt.keyCode != 8)
        if (!(evt.location == 3 && (evt.keyCode > 95 && 106 > evt.keyCode)))
            evt.preventDefault();
});

page_number.addEventListener("dblclick", function(evt) {
    page_number.setAttribute("contenteditable", "true");
    page_number.focus();
});

page_number.addEventListener("focusout", function(evt) {
    page_number.removeAttribute("contenteditable");
    page_number.blur();
    var page = parseInt(page_number.innerText);

    if (isNaN(page))
        page = 1;

    /* truncate page numbers below a thousand for UI reasons */
    if (page > 999)
        page = 999;

    if (0 >= page)
        page = 1;

    setPageNumber(page);
});

function setPageNumber(number) {
    app.input.page = number;
    page_number.innerText = number;
}
