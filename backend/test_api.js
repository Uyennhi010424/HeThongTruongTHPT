const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post("http://localhost:8080/api/auth/login", {
            username: "admin",
            password: "adminpassword" // Wait, I don't know the password. Let's just create a test token or check the DB.
        });
        const token = loginRes.data.data.token;
        
        const res = await axios.post("http://localhost:8080/api/hocsinh/760/chuyen-truong", null, {
            params: { truongMoi: 'Test School' },
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log("SUCCESS:", res.data);
    } catch (err) {
        console.error("ERROR:", err.response ? err.response.data : err.message);
    }
}
test();
