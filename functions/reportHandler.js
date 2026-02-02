const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../data/reports.json");

// Membaca data dari file JSON
function readData() {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
}

// Menyimpan data ke file JSON
function writeData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Menyimpan laporan bug
function saveReportData(userId, title, description, evidence) {
  const data = readData();
  data[userId] = { title, description, evidence };
  writeData(data);
}

// Mendapatkan laporan bug berdasarkan userId
function getUserReport(userId) {
  const data = readData();
  return data[userId];
}

// Menghapus laporan bug berdasarkan userId
function deleteReportData(userId) {
  const data = readData();
  delete data[userId];
  writeData(data);
}

module.exports = {
  saveReportData,
  getUserReport,
  deleteReportData,
};
