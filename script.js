function loadFromLocalStorage() {
  const savedData = localStorage.getItem("sgpa_cgpa_data");
  if (!savedData) return;

  const parsed = JSON.parse(savedData);
  const tableBody = document.getElementById("course-body");

  // Clear all existing rows except one
  tableBody.innerHTML = "";

  parsed.courses.forEach((row) => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" placeholder="Course Name" value="${row.name}"></td>
        <td><input type="number" class="credit-input" min="0" step="0.5" value="${row.credit}"></td>
        <td>
          <select class="grade-select">
            <option value="">--Select--</option>
            <option value="10">A</option>
            <option value="9">A-</option>
            <option value="8">B</option>
            <option value="7">B-</option>
            <option value="5">C</option>
            <option value="2">E</option>
          </select>
        </td>
        <td><button class="delete-row">Delete</button></td>
      `;
    tableBody.appendChild(newRow);
    newRow.querySelector("select").value = row.grade;
  });

  document.getElementById("cgpa-calc-current-cgpa").value =
    parsed.cgpaInfo.currentCgpa || "";
  document.getElementById("prev-credits").value =
    parsed.cgpaInfo.prevCredits || "";

  addDeleteListeners();
  addLiveListeners();
  calculateLiveSGPA();
}

// Add a new course row
document.getElementById("add-row").addEventListener("click", () => {
  const tableBody = document.getElementById("course-body");
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
        <td><input type="text" placeholder="Course Name"></td>
        <td><input type="number" class="credit-input" min="0" step="0.5"></td>
        <td>
          <select class="grade-select">
            <option value="">--Select--</option>
            <option value="10">A</option>
            <option value="9">A-</option>
            <option value="8">B</option>
            <option value="7">B-</option>
            <option value="5">C</option>
            <option value="2">E</option>
          </select>
        </td>
        <td><button class="delete-row">Delete</button></td>
      `;

  tableBody.appendChild(newRow);
  addDeleteListeners(); // Ensure new delete buttons work
  addLiveListeners(); // Add live calculation listeners
  calculateLiveSGPA(Infinity); // Recalculate after new row
});

// Delete a course row
function addDeleteListeners() {
  const deleteButtons = document.querySelectorAll(".delete-row");
  deleteButtons.forEach((btn) => {
    btn.onclick = () => {
      btn.parentElement.parentElement.remove();
      calculateLiveSGPA(Infinity); // Recalculate SGPA after deletion
      saveToLocalStorage(); // update storage after delete
    };
  });
}
addDeleteListeners(); // Initial call

// Live SGPA calculation
function calculateLiveSGPA(validateUntil = Infinity) {
  const creditInputs = document.querySelectorAll(".credit-input");
  const gradeSelects = document.querySelectorAll(".grade-select");

  let totalPoints = 0;
  let totalCredits = 0;
  let warnings = [];

  // Clear old borders
  creditInputs.forEach((input) => (input.style.border = ""));
  gradeSelects.forEach((select) => (select.style.border = ""));
  for (let i = 0; i < creditInputs.length; i++) {
    const credit = parseFloat(creditInputs[i].value);
    const gradePoint = parseFloat(gradeSelects[i].value);

    // Skip validation for current/future rows
    if (validateUntil !== Infinity && i >= validateUntil) {
      if (!isNaN(credit) && !isNaN(gradePoint)) {
        totalCredits += credit;
        totalPoints += credit * gradePoint;
      }
      continue;
    }

    // ✅ Validate only previous rows
    let isInvalid = false;

    if (isNaN(credit)) {
      creditInputs[i].style.border = "2px solid red";
      isInvalid = true;
    }
    if (isNaN(gradePoint)) {
      gradeSelects[i].style.border = "2px solid red";
      isInvalid = true;
    }

    if (isInvalid) {
      warnings.push(`Row ${i + 1}: Missing credit or grade`);
      continue;
    }

    totalCredits += credit;
    totalPoints += credit * gradePoint;
  }

  const sgpaBox = document.getElementById("sgpa-result");
  const warningBox = document.getElementById("sgpa-warning");

  if (totalCredits === 0) {
    sgpaBox.innerText = `Waiting for valid inputs...`;
    warningBox.innerHTML = warnings.join("<br>");
    return;
  }

  const sgpa = (totalPoints / totalCredits).toFixed(2);
  sgpaBox.innerText = `Your SGPA is: ${sgpa}`;
  warningBox.innerHTML = warnings.join("<br>");
}

// Add real-time listeners to all inputs
function addLiveListeners() {
  const creditInputs = document.querySelectorAll(".credit-input");
  const gradeSelects = document.querySelectorAll(".grade-select");
  const nameInputs = document.querySelectorAll('input[type="text"]');

  creditInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      calculateLiveSGPA(index);
      saveToLocalStorage();
    });
    input.addEventListener("focus", () => calculateLiveSGPA(index));
  });

  gradeSelects.forEach((select, index) => {
    select.addEventListener("change", () => {
      calculateLiveSGPA(index);
      saveToLocalStorage();
    });
    select.addEventListener("focus", () => calculateLiveSGPA(index));
  });

  nameInputs.forEach((input) => {
    input.addEventListener("input", saveToLocalStorage);
  });

  // Also track CGPA input fields
  document
    .getElementById("cgpa-calc-current-cgpa")
    .addEventListener("input", saveToLocalStorage);
  document
    .getElementById("prev-credits")
    .addEventListener("input", saveToLocalStorage);
}

addLiveListeners();
calculateLiveSGPA(Infinity); // Show initial result

// Calculate CGPA (on button click only)
document.getElementById("calculate-cgpa").addEventListener("click", () => {
  const currentCgpa = parseFloat(
    document.getElementById("cgpa-calc-current-cgpa").value
  );
  const prevCredits = parseFloat(document.getElementById("prev-credits").value);

  const creditInputs = document.querySelectorAll(".credit-input");
  const gradeSelects = document.querySelectorAll(".grade-select");

  let currentPoints = 0;
  let currentCredits = 0;

  for (let i = 0; i < creditInputs.length; i++) {
    const credit = parseFloat(creditInputs[i].value);
    const gradePoint = parseFloat(gradeSelects[i].value);

    if (!isNaN(credit) && !isNaN(gradePoint)) {
      currentCredits += credit;
      currentPoints += credit * gradePoint;
    }
  }

  if (isNaN(currentCgpa) || isNaN(prevCredits)) {
    alert("Please enter valid current CGPA and total previous credits.");
    return;
  }

  const prevPoints = currentCgpa * prevCredits;
  const totalCredits = prevCredits + currentCredits;
  const totalPoints = prevPoints + currentPoints;

  const cgpa = (totalPoints / totalCredits).toFixed(2);
  document.getElementById(
    "cgpa-result"
  ).innerText = `Your Updated CGPA is: ${cgpa}`;
});

// --- Dark Mode Toggle ---
const themeToggle = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");

// Apply saved theme on load
if (currentTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.innerText = "☀️ Light Mode";
}

// Toggle theme on click
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// --- GPA Improvement Planner ---
document
  .getElementById("calculate-target-sgpa")
  .addEventListener("click", () => {
    const resultBox = document.getElementById("target-sgpa-result");

    // Safely get values and guard against null
    const cgpaInput = document.getElementById("planner-current-cgpa");
    const totalCreditsInput = document.getElementById("current-total-credits");
    const nextCreditsInput = document.getElementById("next-sem-credits");
    const targetCgpaInput = document.getElementById("target-cgpa");

    if (
      !cgpaInput ||
      !totalCreditsInput ||
      !nextCreditsInput ||
      !targetCgpaInput
    ) {
      resultBox.innerText = "❌ Some input fields are missing from the page.";
      return;
    }

    const currentCGPA = parseFloat(cgpaInput.value.trim());
    const totalCredits = parseFloat(totalCreditsInput.value.trim());
    const nextSemCredits = parseFloat(nextCreditsInput.value.trim());
    const targetCGPA = parseFloat(targetCgpaInput.value.trim());

    // Validate
    if (
      isNaN(currentCGPA) ||
      isNaN(totalCredits) ||
      isNaN(nextSemCredits) ||
      isNaN(targetCGPA) ||
      totalCredits < 0 ||
      nextSemCredits <= 0
    ) {
      resultBox.innerText = "⚠️ Please enter valid and non-negative numbers.";
      return;
    }

    const currentPoints = currentCGPA * totalCredits;
    const requiredTotalPoints = targetCGPA * (totalCredits + nextSemCredits);
    const requiredNextSemPoints = requiredTotalPoints - currentPoints;
    const requiredSGPA = requiredNextSemPoints / nextSemCredits;

    if (requiredSGPA > 10.0001) {
      resultBox.innerText = `🚫 Target CGPA of ${targetCGPA} is not achievable with max SGPA 10.`;
    } else {
      resultBox.innerText = `🎯 You need an SGPA of at least ${requiredSGPA.toFixed(
        2
      )} next semester to reach a CGPA of ${targetCGPA}.`;
    }
  });

document
  .getElementById("calculate-reverse-cgpa")
  .addEventListener("click", () => {
    const currentCGPA = parseFloat(
      document.getElementById("rev-current-cgpa").value
    );
    const currentCredits = parseFloat(
      document.getElementById("rev-current-total-credits").value
    );
    const expectedSGPA = parseFloat(
      document.getElementById("rev-expected-sgpa").value
    );
    const nextCredits = parseFloat(
      document.getElementById("rev-next-sem-credits").value
    );
    const resultBox = document.getElementById("reverse-cgpa-result");

    if (
      isNaN(currentCGPA) ||
      isNaN(currentCredits) ||
      isNaN(expectedSGPA) ||
      isNaN(nextCredits) ||
      nextCredits <= 0 ||
      currentCredits < 0 ||
      currentCGPA < 0 ||
      expectedSGPA < 0
    ) {
      resultBox.innerText = "Please enter valid numbers in all fields.";
      return;
    }

    const totalPoints =
      currentCGPA * currentCredits + expectedSGPA * nextCredits;
    const totalCredits = currentCredits + nextCredits;
    const newCGPA = (totalPoints / totalCredits).toFixed(2);

    resultBox.innerText = `📈 Your new CGPA after next semester will be: ${newCGPA}`;
  });

function saveToLocalStorage() {
  const courseRows = [];
  const creditInputs = document.querySelectorAll(".credit-input");
  const gradeSelects = document.querySelectorAll(".grade-select");
  const nameInputs = document.querySelectorAll('input[type="text"]');

  for (let i = 0; i < creditInputs.length; i++) {
    courseRows.push({
      name: nameInputs[i].value,
      credit: creditInputs[i].value,
      grade: gradeSelects[i].value,
    });
  }

  const currentCgpa = document.getElementById("cgpa-calc-current-cgpa").value;
  const prevCredits = document.getElementById("prev-credits").value;

  const data = {
    courses: courseRows,
    cgpaInfo: {
      currentCgpa,
      prevCredits,
    },
  };

  localStorage.setItem("sgpa_cgpa_data", JSON.stringify(data));
}
function clearSavedData() {
  localStorage.removeItem("sgpa_cgpa_data");
  location.reload(); // Refresh to reflect cleared state
}

loadFromLocalStorage(); // <-- auto run
