import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBC598epFdcqsFp9cg3y9-Fi40PvpGX44I",
  authDomain: "nailajasmin-c3d98.firebaseapp.com",
  projectId: "nailajasmin-c3d98",
  storageBucket: "nailajasmin-c3d98.firebasestorage.app",
  messagingSenderId: "179905162603",
  appId: "1:179905162603:web:f39f966d49b4719eeb302e",
  measurementId: "G-V7220VWRK2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const barangList = document.getElementById("barangList");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const barangForm = document.getElementById("barangForm");
const alertBox = document.getElementById("alertBox");

let currentDocId = null;

const fotoInput = document.getElementById("fotoBarang");
const fotoInput2 = document.getElementById("fotoBarang2");
const previewImage = document.getElementById("previewImage");
const previewImage2 = document.getElementById("previewImage2");

// Preview Foto 1
fotoInput.addEventListener("change", () => {
  const file = fotoInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});

// Preview Foto 2
fotoInput2.addEventListener("change", () => {
  const file = fotoInput2.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage2.src = e.target.result;
      previewImage2.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});

// Compress image to base64
function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Load list barang
onSnapshot(collection(db, "barang"), (snapshot) => {
  barangList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Jika sudah diverifikasi admin, jangan tampilkan
    if (data.verifikasiAdmin) return;

    const li = document.createElement("li");
    li.className = `p-4 rounded shadow cursor-pointer hover:bg-blue-50 
      ${
        data.verifikasi
          ? "bg-green-100 border-l-4 border-green-500"
          : "bg-white"
      }`;

    li.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="font-semibold">${data.nama}</span>
        <span class="text-sm text-gray-600">Kebutuhan: ${
          data.jumlahKebutuhan
        }</span>
      </div>
      ${
        data.verifikasi
          ? `<div class="flex items-center text-green-600 text-sm mt-1">
          <span class="mr-1">✅</span> Telah diverifikasi (${
            data.verifikasiTanggal || ""
          } ${data.verifikasiJam || ""})
        </div>`
          : ""
      }
    `;
    li.addEventListener("click", () => openModal(docSnap.id, data));
    barangList.appendChild(li);
  });
});

// Saat buka modal, tampilkan foto lama jika ada
function openModal(id, data) {
  currentDocId = id;
  document.getElementById("namaBarang").value = data.nama || "";
  document.getElementById("jumlahKebutuhan").value = data.jumlahKebutuhan || "";
  document.getElementById("jumlahDatang").value = data.jumlahDatang || "";
  document.getElementById("satuanBarang").value = data.satuan || "";
  document.getElementById("tanggalBarang").value = data.tanggal || "";
  document.getElementById("jamBarang").value = data.jam || "";
  document.getElementById("verifikasiBarang").checked =
    data.verifikasi || false;

  previewImage.src = data.foto1 || "";
  previewImage.classList.toggle("hidden", !data.foto1);
  previewImage2.src = data.foto2 || "";
  previewImage2.classList.toggle("hidden", !data.foto2);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Close modal
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
});

// Show animated alert
function showAlert() {
  const box = alertBox.firstElementChild;
  alertBox.classList.remove("hidden");
  setTimeout(() => {
    box.classList.remove("opacity-0", "scale-90");
    box.classList.add("opacity-100", "scale-100");
  }, 50);

  setTimeout(() => {
    box.classList.remove("opacity-100", "scale-100");
    box.classList.add("opacity-0", "scale-90");
    setTimeout(() => alertBox.classList.add("hidden"), 500);
  }, 3000);
}

// Update form
barangForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentDocId) return;

  const submitBtn = barangForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
  </svg>`;

  const jumlahDatang = document.getElementById("jumlahDatang").value;
  const satuan = document.getElementById("satuanBarang").value;
  const tanggal = document.getElementById("tanggalBarang").value;
  const jam = document.getElementById("jamBarang").value;
  const verifikasi = document.getElementById("verifikasiBarang").checked;

  const now = new Date();
  const verifikasiTanggal = verifikasi ? now.toLocaleDateString("id-ID") : "";
  const verifikasiJam = verifikasi
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "";

  let fotoBase64_1 = "";
  let fotoBase64_2 = "";
  if (fotoInput.files[0])
    fotoBase64_1 = await compressImage(fotoInput.files[0]);
  if (fotoInput2.files[0])
    fotoBase64_2 = await compressImage(fotoInput2.files[0]);

  const docRef = doc(db, "barang", currentDocId);
  await updateDoc(docRef, {
    jumlahDatang,
    satuan,
    tanggal,
    jam,
    verifikasi,
    ...(verifikasi && { verifikasiTanggal, verifikasiJam }),
    ...(fotoBase64_1 && { foto1: fotoBase64_1 }),
    ...(fotoBase64_2 && { foto2: fotoBase64_2 }),
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Update";

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  showAlert();
});
