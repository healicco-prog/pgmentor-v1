const testData = {
  id: "test-resume-1234",
  user_id: "default",
  full_name: "API Test User",
  professional_title: "Sr. API Tester",
  email: "api@test.com",
  summary: "Testing the newly created endpoint directly.",
  education: [],
  experience: [],
  skills: ["API Testing", "Node.js"],
  publications: [],
  certifications: [],
  awards: [],
  memberships: [],
  conferences: [],
  selected_template: "classic",
  date: new Date().toISOString(),
  title: "API Test Resume",
  content: "{}"
};

async function runTest() {
  try {
    console.log("Sending POST to http://localhost:3006/api/resume-builder...");
    const res = await fetch("http://localhost:3006/api/resume-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData)
    });
    const result = await res.json();
    console.log("POST Result:", result);

    console.log("Sending GET to http://localhost:3006/api/resume-builder...");
    const resGet = await fetch("http://localhost:3006/api/resume-builder");
    const getResult = await resGet.json();
    console.log("GET Result (first 2 items):", getResult.slice(0, 2));
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
