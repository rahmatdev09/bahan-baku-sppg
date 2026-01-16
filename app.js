import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- Configuration & Initialization ---
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

// --- State & Elements ---
let currentDocId = null;
const elements = {
  barangList: document.getElementById("barangList"),
  skeleton: document.getElementById("skeletonLoader"),
  modal: document.getElementById("modal"),
  modalContent: document.getElementById("modalContent"),
  closeModal: document.getElementById("closeModal"),
  barangForm: document.getElementById("barangForm"),
  alertBox: document.getElementById("alertBox"),
  globalLoader: document.getElementById("globalLoader"),
  foto1: document.getElementById("fotoBarang"),
  foto2: document.getElementById("fotoBarang2"),
  preview1: document.getElementById("previewImage"),
  preview2: document.getElementById("previewImage2"),
  placeholder1: document.getElementById("placeholder1"),
  placeholder2: document.getElementById("placeholder2"),
};

// --- UI Helpers ---
const toggleSkeleton = (isLoading) => {
  if (isLoading) {
    elements.skeleton.classList.remove("hidden");
    elements.barangList.classList.add("hidden");
  } else {
    elements.skeleton.classList.add("hidden");
    elements.barangList.classList.remove("hidden");
  }
};

const showGlobalLoading = (show) => {
  elements.globalLoader.classList.toggle("hidden", !show);
};

const showToast = () => {
  const toastInner = elements.alertBox.querySelector("div");
  elements.alertBox.classList.remove("hidden");
  setTimeout(() => {
    toastInner.classList.remove("opacity-0", "scale-90", "translate-y-4");
    toastInner.classList.add("opacity-100", "scale-100", "translate-y-0");
  }, 10);

  setTimeout(() => {
    toastInner.classList.add("opacity-0", "scale-90", "translate-y-4");
    setTimeout(() => elements.alertBox.classList.add("hidden"), 500);
  }, 3000);
};

// --- Image Handling ---
const handlePreview = (input, preview, placeholder) => {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
      placeholder.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }
};

elements.foto1.addEventListener("change", () => handlePreview(elements.foto1, elements.preview1, elements.placeholder1));
elements.foto2.addEventListener("change", () => handlePreview(elements.foto2, elements.preview2, elements.placeholder2));

function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Data Fetching ---
onSnapshot(collection(db, "barang"), (snapshot) => {
  toggleSkeleton(true);
  elements.barangList.innerHTML = "";
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.verifikasiAdmin) return;

    const li = document.createElement("li");
    li.className = `group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex justify-between items-center ${data.verifikasi ? 'border-l-4 border-l-green-500' : ''}`;

    li.innerHTML = `
      <div class="space-y-1">
        <h3 class="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">${data.nama}</h3>
        <p class="text-sm text-slate-500">Kebutuhan: <span class="font-semibold text-slate-700">${data.jumlahKebutuhan}</span></p>
        ${data.verifikasi ? `
          <div class="flex items-center text-[11px] font-bold uppercase tracking-wider text-green-600 mt-2 bg-green-50 px-2 py-1 rounded-lg w-fit">
            <span class="mr-1">✓</span> Terverifikasi ${data.verifikasiTanggal || ""}
          </div>
        ` : ''}
      </div>
      <div class="p-2 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    `;
    
    li.onclick = () => openModal(docSnap.id, data);
    elements.barangList.appendChild(li);
  });
  
  // Berikan sedikit jeda agar transisi halus
  setTimeout(() => toggleSkeleton(false), 600);
});

// --- Modal Actions ---
function openModal(id, data) {
  currentDocId = id;
  document.getElementById("namaBarang").value = data.nama || "";
  document.getElementById("jumlahKebutuhan").value = data.jumlahKebutuhan || "";
  document.getElementById("jumlahDatang").value = data.jumlahDatang || "";
  document.getElementById("satuanBarang").value = data.satuan || "";
  document.getElementById("tanggalBarang").value = data.tanggal || "";
  document.getElementById("jamBarang").value = data.jam || "";
  document.getElementById("verifikasiBarang").checked = data.verifikasi || false;

  // Reset & Set Previews
  [elements.preview1, elements.preview2].forEach(p => p.classList.add("hidden"));
  [elements.placeholder1, elements.placeholder2].forEach(p => p.classList.remove("hidden"));

  if (data.foto1) {
    elements.preview1.src = data.foto1;
    elements.preview1.classList.remove("hidden");
    elements.placeholder1.classList.add("hidden");
  }
  if (data.foto2) {
    elements.preview2.src = data.foto2;
    elements.preview2.classList.remove("hidden");
    elements.placeholder2.classList.add("hidden");
  }

  elements.modal.classList.remove("hidden");
  setTimeout(() => {
    elements.modalContent.classList.remove("scale-95", "opacity-0");
    elements.modalContent.classList.add("scale-100", "opacity-100");
  }, 10);
}

const closeModalFunc = () => {
  elements.modalContent.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    elements.modal.classList.add("hidden");
    elements.barangForm.reset();
  }, 300);
};

elements.closeModal.onclick = closeModalFunc;

// --- Submit Logic ---
elements.barangForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!currentDocId) return;

  showGlobalLoading(true);

  const verifikasi = document.getElementById("verifikasiBarang").checked;
  const now = new Date();
  
  const updateData = {
    jumlahDatang: document.getElementById("jumlahDatang").value,
    satuan: document.getElementById("satuanBarang").value,
    tanggal: document.getElementById("tanggalBarang").value,
    jam: document.getElementById("jamBarang").value,
    verifikasi: verifikasi,
    ...(verifikasi && { 
      verifikasiTanggal: now.toLocaleDateString("id-ID"),
      verifikasiJam: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
    }),
  };

  try {
    if (elements.foto1.files[0]) updateData.foto1 = await compressImage(elements.foto1.files[0]);
    if (elements.foto2.files[0]) updateData.foto2 = await compressImage(elements.foto2.files[0]);

    await updateDoc(doc(db, "barang", currentDocId), updateData);
    
    closeModalFunc();
    showToast();
  } catch (error) {
    console.error("Error updating:", error);
    alert("Gagal mengupdate data.");
  } finally {
    showGlobalLoading(false);
  }
};

