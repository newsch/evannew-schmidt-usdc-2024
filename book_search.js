/** 
 * RECOMMENDATION
 * 
 * To test your code, you should open "tester.html" in a web browser.
 * You can then use the "Developer Tools" to see the JavaScript console.
 * There, you will see the results unit test execution. You are welcome
 * to run the code any way you like, but this is similar to how we will
 * run your code submission.
 * 
 * The Developer Tools in Chrome are available under the "..." menu, 
 * futher hidden under the option "More Tools." In Firefox, they are 
 * under the hamburger (three horizontal lines), also hidden under "More Tools." 
 */

/**
 * Searches for matches in scanned text.
 * @param {string} searchTerm - The word or term we're searching for.
 * @param {JSON} scannedTextObj - A JSON object representing the scanned text.
 * @returns {JSON} - Search results.
 * @throws {TypeError} Parameters are null/undefined/not required type.
 *
 */
 function findSearchTermInBooks(searchTerm, scannedTextObj) {
    if (typeof searchTerm !== "string")
        throw new TypeError("parameter 'searchTerm' is not a string");
    if (!Array.isArray(scannedTextObj))
        throw new TypeError("parameter 'scannedTextObj' is not an array");

    const results = [];
    const response = {
        "SearchTerm": searchTerm,
        "Results": results,
    };

    if (searchTerm === "")
        return response;

    for (const book of scannedTextObj) {
        const ISBN = book.ISBN;

        let lastLine = null;
        // FIXME: assumes Content to be sorted by Page, then Line
        for (const scannedLine of book.Content) {
            // ignore last line if there are gaps in scans
            if (lastLine !== null && !areAdjacentLines(lastLine, scannedLine)) {
                lastLine = null;
            }

            if (scannedLine.Text.includes(searchTerm)) {
                // direct line match
                results.push({
                    ISBN,
                    "Page": scannedLine.Page,
                    "Line": scannedLine.Line,
                });
            } else if (lastLine?.Text.endsWith("-")) {
                // handle cross-line/cross-page hyphenations
                // FIXME: assumes single ascii hyphen with no whitespace at start or end of line
                const joinedText = lastLine.Text.slice(0, -1) + scannedLine.Text;
                if (joinedText.includes(searchTerm)) {
                    results.push({
                        ISBN,
                        "Page": lastLine.Page,
                        "Line": lastLine.Line,
                    });
                }
            }
            lastLine = scannedLine;
        }
    }

    return response;
}

function areAdjacentLines(lastLine, nextLine) {
    const isNextLineOnPage =
        lastLine.Page === nextLine.Page
        && lastLine.Line + 1 === nextLine.Line;

    const isFirstLineOnNextPage =
        lastLine.Page + 1 === nextLine.Page
        // FIXME: assumes line numbers to be 1-based
        && nextLine.Line === 1;

    return isNextLineOnPage || isFirstLineOnNextPage;
}

/** Example input object. */
const twentyLeaguesIn = [
    {
        "Title": "Twenty Thousand Leagues Under the Sea",
        "ISBN": "9780000528531",
        "Content": [
            {
                "Page": 31,
                "Line": 8,
                "Text": "now simply went on by her own momentum.  The dark-"
            },
            {
                "Page": 31,
                "Line": 9,
                "Text": "ness was then profound; and however good the Canadian\'s"
            },
            {
                "Page": 31,
                "Line": 10,
                "Text": "eyes were, I asked myself how he had managed to see, and"
            } 
        ] 
    }
]
    
/** Example output object */
const twentyLeaguesOut = {
    "SearchTerm": "the",
    "Results": [
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
        }
    ]
}

/*
 _   _ _   _ ___ _____   _____ _____ ____ _____ ____  
| | | | \ | |_ _|_   _| |_   _| ____/ ___|_   _/ ___| 
| | | |  \| || |  | |     | | |  _| \___ \ | | \___ \ 
| |_| | |\  || |  | |     | | | |___ ___) || |  ___) |
 \___/|_| \_|___| |_|     |_| |_____|____/ |_| |____/ 
                                                      
 */

/* We have provided two unit tests. They're really just `if` statements that 
 * output to the console. We've provided two tests as examples, and 
 * they should pass with a correct implementation of `findSearchTermInBooks`. 
 * 
 * Please add your unit tests below.
 * */

function run_tests() {
    let test_count = 0;
    let failures = 0;

    /** Records failure if invoking t raises an exception. */
    function test(name, t) {
        test_count++;
        let err;
        try {
            t();
        } catch (e) {
            err = e;
        }
        const description = `Test ${test_count} ${name}`;
        if (err) {
            failures++;
            console.error("FAIL:", description, err);
        } else {
            console.log("PASS:", description);
        }
    }

    function assert(pass, msg) {
        if (!pass)
            throw new Error(msg);
    }

    function assert_eq(expected, received, msg) {
        let are_equal;
        if (typeof expected === "object" && typeof received === "object") {
            // NOTE: this does not handle different ordering of fields
            are_equal = JSON.stringify(expected) === JSON.stringify(received);
        } else {
            are_equal = expected === received;
        }
        if (!are_equal) {
            console.error("Expected:", expected);
            console.error("Received:", received);
        }
        assert(are_equal, msg);
    }

    function assert_throws(err_class, f) {
        const expected_name = err_class.name ?? err_class.toString();
        try {
            f()
        } catch (err) {
            if (!(err instanceof err_class)) {
                const err_name = err.name ?? err.toString();
                throw new Error(`Thrown ${err_name} is not instanceof ${expected_name}`);
            }
            return;
        }
        throw new Error(`${expected_name} was not thrown`);
    }

    // Positive tests

    /** We can check that, given a known input, we get a known output. */
    test("twentyleagues_the_cmp", () => {
        const test1result = findSearchTermInBooks("the", twentyLeaguesIn);
        assert_eq(twentyLeaguesOut, test1result);
    });

    /** We could choose to check that we get the right number of results. */
    test("twentyleagues_the_length", () => {
        const test2result = findSearchTermInBooks("the", twentyLeaguesIn); 
        assert_eq(twentyLeaguesOut.Results.length, test2result.Results.length);
    });

    // Cross-line tests

    test("twentyleagues_darkness_multiline", () => {
        const ISBN = "9780000528531";
        const SearchTerm = "darkness";
        const expected = {
            SearchTerm,
            "Results": [
                {
                    ISBN,
                    "Page": 31,
                    "Line": 8
                },
            ]
        };
        assert_eq(expected, findSearchTermInBooks(SearchTerm, twentyLeaguesIn),
            "searchTerm wrapped across multiple lines should be found");
    });

    test("twentyleagues_dark-ness_returns_none", () => {
        assert_eq(0, findSearchTermInBooks("dark-ness", twentyLeaguesIn).Results.length,
            "hyphenated form of searchTerm should not be found");
    });

    // Negative tests

    test("twentyleagues_banana_returns_none", () => {
        assert_eq(0, findSearchTermInBooks("banana", twentyLeaguesIn).Results.length);
    });

    test("twentyleagues_empty_returns_none", () => {
        assert_eq(0, findSearchTermInBooks("", twentyLeaguesIn).Results.length);
    });

    // Case-sensitive tests

    test("twentyleagues_i_returns_none", () => {
        assert_eq(0, findSearchTermInBooks(" i ", twentyLeaguesIn).Results.length);
    });

    test("twentyleagues_I_returns_one", () => {
        assert_eq(1, findSearchTermInBooks(" I ", twentyLeaguesIn).Results.length);
    });

    test("twentyleagues_canadian_returns_none", () => {
        assert_eq(0, findSearchTermInBooks("canadian", twentyLeaguesIn).Results.length);
    });

    test("twentyleagues_Canadian_returns_one", () => {
        assert_eq(1, findSearchTermInBooks("Canadian", twentyLeaguesIn).Results.length);
    });

    // Bad types/failed preconditions tests

    test("twentyleagues_nonstring_throws", () => {
        assert_throws(TypeError, () => {
            findSearchTermInBooks(123, twentyLeaguesIn);
        });
    });

    test("twentyleagues_null_search_throws", () => {
        assert_throws(TypeError, () => {
            findSearchTermInBooks(null, twentyLeaguesIn);
        });
    });

    test("twentyleagues_null_books_throws", () => {
        assert_throws(TypeError, () => {
            findSearchTermInBooks("the", null);
        });
    });

    test("empty_books_returns_none", () => {
        const expected = {
            "SearchTerm": "the",
            "Results": []
        };
        assert_eq(expected, findSearchTermInBooks("the", []));
    });

    test("empty_lines_returns_none", () => {
        const expected = {
            "SearchTerm": "the",
            "Results": []
        };
        assert_eq(expected, findSearchTermInBooks("the", [
            {
                "Title": "Twenty Thousand Leagues Under the Sea",
                "ISBN": "9780000528531",
                "Content": []
            }
        ]));
    });

    if (failures > 0) {
        console.error(failures, "tests failed");
    } else {
        console.log("All tests passed");
    }
}

run_tests();
