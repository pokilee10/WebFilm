// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDGn25lfLVLX2eahI41LTLFx9whEZrgRIk",
    authDomain: "web-phim-6b76c.firebaseapp.com",
    databaseURL: "https://web-phim-6b76c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web-phim-6b76c",
    storageBucket: "web-phim-6b76c.appspot.com",
    messagingSenderId: "676922439385",
    appId: "1:676922439385:web:476eea9d5265771ce230c8",
    measurementId: "G-B6Y0DSKFV2"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.database();
  let currentUser = null;
  let allMovies = [];
  
  // Load giao diện động
  function loadPage(page, callback) {
    fetch(page)
      .then(res => res.text())
      .then(html => {
        document.getElementById('app').innerHTML = html;
        if (callback) callback();
      });
  }
  
    // Thêm loading indicator
    document.body.innerHTML += '<div id="loading" style="position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#232526cc;z-index:9999;color:#fff;font-size:2rem;">Đang xác thực...</div>';

    auth.onAuthStateChanged(user => {
    currentUser = user;
    document.getElementById('loading').remove();
    if (!user) {
        // Đợi 300ms rồi mới chuyển trang, tránh nháy
        setTimeout(() => window.location.href = "login.html", 300);
    } else {
        document.getElementById('userInfo').style.display = '';
        document.getElementById('userEmail').innerText = user.email;
    }
});
  
  // Đăng ký/Đăng nhập/Đăng xuất
  function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => alert('Đăng ký thành công!'))
      .catch(e => alert(e.message));
  }
  function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => alert('Đăng nhập thành công!'))
      .catch(e => alert(e.message));
  }
  function logout() {
    auth.signOut();
    alert('Đã đăng xuất!');
  }
  
  // Setup giao diện login
  function setupLoginPage() {
    document.getElementById('authForms').style.display = '';
    document.getElementById('userInfo').style.display = 'none';
  }
  
  // Setup giao diện main
  function setupMainPage() {
    document.getElementById('mainSection').style.display = '';
    document.getElementById('userEmail').innerText = currentUser.email;
    document.getElementById('userInfo').style.display = '';
    document.getElementById('authForms').style.display = 'none';
  
    document.getElementById('csvFile').addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (event) {
        const text = event.target.result;
        const movies = parseCSV(text);
        renderMovies(movies);
      };
      reader.readAsText(file);
    });
  }
  
  // Các hàm xử lý phim
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const movies = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const movie = {};
      headers.forEach((header, index) => {
        movie[header] = values[index] || '';
      });
      try {
        const genresRaw = movie.genres.replace(/""/g, '"');
        const genres = JSON.parse(genresRaw);
        movie.genres_str = Array.isArray(genres)
          ? genres.map(g => g.name).join(', ')
          : '';
      } catch (e) {
        movie.genres_str = movie.genres;
      }
      movie.title = movie.title || movie.original_title || `Phim #${i}`;
      movie.release_date = movie.release_date || '';
      movie.vote_average = movie.vote_average || '';
      movie.overview = movie.overview || '';
      movies.push(movie);
    }
    return movies;
  }
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
  function renderMovies(movies) {
    const container = document.getElementById('movieList');
    container.innerHTML = '';
    allMovies = movies;
    const genreSet = new Set();
    movies.forEach(movie => {
      if (movie.genres_str) {
        movie.genres_str.split(',').forEach(g => genreSet.add(g.trim()));
      }
    });
    const genreFilter = document.getElementById('genreFilter');
    genreFilter.innerHTML = `<option value="">-- Tất cả --</option>`;
    Array.from(genreSet).sort().forEach(genre => {
      genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`;
    });
    genreFilter.onchange = () => filterByGenre(genreFilter.value);
    renderMovieList(movies);
  }
  function renderMovieList(movies) {
    const container = document.getElementById('movieList');
    container.innerHTML = '';
    movies.forEach(movie => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 movie-card';
      col.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title"><i class="bi bi-film"></i> ${movie.title}</h5>
            <p><strong>Thể loại:</strong> ${movie.genres_str}</p>
            <p><strong>Ngày phát hành:</strong> ${movie.release_date}</p>
            <p><strong>Điểm đánh giá:</strong> <span class="text-warning">${movie.vote_average}</span></p>
            <p>${movie.overview}</p>
            <button class="like-btn mt-auto" onclick="likeMovie('${movie.title.replace(/'/g, "\\'")}')">
              <i class="bi bi-heart-fill"></i> Thích
            </button>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  }
  function filterByGenre(genre) {
    if (!genre) {
      renderMovieList(allMovies);
      return;
    }
    const filtered = allMovies.filter(movie =>
      movie.genres_str.split(',').map(g => g.trim()).includes(genre)
    );
    renderMovieList(filtered);
  }
  function likeMovie(title) {
    if (!currentUser) {
      alert('Bạn cần đăng nhập để thích phim!');
      return;
    }
    alert("Bạn đã thích phim: " + title);
    const userId = currentUser.uid;
    const userMoviesRef = db.ref('users/' + userId + '/liked_movies');
    userMoviesRef.once('value').then(snapshot => {
      let liked = snapshot.val() || [];
      if (!liked.includes(title)) {
        liked.push(title);
        userMoviesRef.set(liked);
      }
    });
  }