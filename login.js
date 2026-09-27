const loginForm = document.getElementById("login-minishopee");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errmsg");
const loginBtn = document.getElementById("masuk");

if (localStorage.getItem("firstName")) {
    window.location.href = "katalog.html";
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document
        .getElementById("username")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value
        .trim();

    errorMessage.classList.add("hidden");
    loading.classList.remove("hidden");
    loginBtn.disabled = true;

    try {

        const response = await fetch(
            "https://dummyjson.com/users"
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil data user");
        }

        const data = await response.json();

        const user = data.users.find(
            (u) =>
                u.username === username &&
                u.password === password
        );

        if (user) {

            localStorage.setItem(
                "firstName",
                user.firstName
            );

            window.location.href = "katalog.html";

        } else {

            errorMessage.textContent =
                "Username atau password salah.";

            errorMessage.classList.remove("hidden");
        }

    } catch (error) {

        errorMessage.textContent =
            "Terjadi kesalahan koneksi ke server.";

        errorMessage.classList.remove("hidden");

    } finally {

        loading.classList.add("hidden");
        loginBtn.disabled = false;

    }
});