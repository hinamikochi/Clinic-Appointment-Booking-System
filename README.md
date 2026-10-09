#  Clinic Booking System - Hệ Thống Đặt Lịch Khám Bệnh Trực Tuyến

![ReactJS](https://img.shields.io/badge/Frontend-ReactJS_18-61DAFB?style=for-the-badge&logo=react)
![NodeJS](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)
![ExpressJS](https://img.shields.io/badge/Framework-Express.js-000000?style=for-the-badge&logo=express)
![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?style=for-the-badge&logo=mysql)
![Sequelize](https://img.shields.io/badge/ORM-Sequelize_v6-52B0E7?style=for-the-badge&logo=sequelize)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker)
![Nginx](https://img.shields.io/badge/Web_Server-Nginx-009639?style=for-the-badge&logo=nginx)

---

##  1. Giới thiệu Tổng quan (Overview)

**Clinic Booking System** là hệ thống ứng dụng hỗ trợ số hóa toàn bộ quy trình **đăng ký, điều phối và quản lý khám chữa bệnh trực tuyến** tại các phòng khám y tế. Hệ thống giải quyết tình trạng xếp hàng chờ đợi thủ công, tối ưu hóa thời gian đặt hẹn và minh bạch hóa thông tin đơn thuốc, hồ sơ bệnh án cho 3 nhóm người dùng chính: **Bệnh nhân**, **Bác sĩ** và **Quản trị viên (Admin)**.

Đề tài thuộc Báo cáo Thực tập Chuyên ngành Công nghệ Thông tin – **Trường Đại học Công nghệ (VNU-UET)**.
- **Sinh viên thực hiện:** Vũ Văn Hiếu (MSV: 23020605 - Lớp K68I-CN)

---

##  2. Các Chức năng Nổi bật (Key Features)

###  Phân hệ Bệnh nhân (Patient)
- **Tra cứu thông tin:** Tìm kiếm chuyên khoa, thông tin bác sĩ, học vị, phòng khám và mức giá niêm yết.
- **Đăng ký đặt lịch khám:** Lựa chọn chuyên khoa, bác sĩ, ngày khám và các khung giờ còn trống (`time_slot`), đồng thời nhập mô tả triệu chứng.
- **Quản lý phiếu hẹn:** Theo dõi danh sách phiếu đặt lịch theo thời gian thực (Trạng thái: *Chờ duyệt, Đã xác nhận, Hoàn thành, Đã hủy*).
- **Hồ sơ bệnh án điện tử:** Xem lại kết quả chẩn đoán, đơn thuốc chi tiết và **in phiếu kết quả khám ra file PDF**.
- **Quản lý tài khoản:** Cập nhật thông tin cá nhân và đổi mật khẩu tài khoản.

###  Phân hệ Bác sĩ (Doctor)
- **Lịch khám phân công:** Theo dõi danh sách bệnh nhân đặt lịch khám theo ngày.
- **Xử lý ca khám:** Tiếp nhận ca khám, cập nhật thông tin chẩn đoán lâm sàng.
- **Kê đơn thuốc điện tử:** Nhập chi tiết tên thuốc, liều lượng, hướng dẫn sử dụng và hẹn ngày tái khám.
- **Đồng bộ hồ sơ:** Lưu trữ tự động kết quả khám vào bảng `medicalrecords` thông qua Database Transaction.

###  Phân hệ Quản trị viên (Admin)
- **Dashboard Thống kê:** Báo cáo trực quan tổng số lượt khám, tỷ lệ ca khám thành công và phân bổ lịch hẹn theo chuyên khoa.
- **Phê duyệt lịch hẹn:** Kiểm tra và thực hiện phê duyệt hoặc hủy các yêu cầu đặt lịch từ bệnh nhân.
- **Quản lý danh mục:** Thêm, sửa, xóa danh mục chuyên khoa và thông tin tài khoản bác sĩ (giá khám, số phòng, học vị).

---

##  3. Công nghệ & Kiến trúc (Tech Stack & Architecture)

| Thành phần | Công nghệ / Thư viện sử dụng |
| :--- | :--- |
| **Frontend** | ReactJS (Vite), Axios, `react-hot-toast`, Responsive Web Design (CSS Media Query) |
| **Backend** | Node.js, Express.js, Sequelize ORM |
| **Database** | MySQL 8.0 (Quan hệ 1-1, 1-N, Khoá ngoại, Indexing) |
| **Bảo mật** | JWT (JSON Web Token), Cơ chế RBAC (Role-Based Access Control) |
| **DevOps / Deployment** | Docker Engine, Docker Compose, Nginx (Multi-stage build, Reverse Proxy) |

---

##  4. Hình ảnh Demo Giao diện (Screenshots)

###  4.1. Giao diện Trang chủ & Tra cứu Bác sĩ theo Chuyên khoa
<img width="3026" height="1644" alt="image" src="https://github.com/user-attachments/assets/e60ca707-9018-4120-a755-b400b1ea358a" />


---

###  4.2. Giao diện Form Đăng ký Đặt lịch Khám bệnh Trực tuyến
<p align="center">
  <img width="400" alt="Giao diện đặt lịch khám bệnh trực tuyến" src="https://github.com/user-attachments/assets/259580ff-3a29-4df9-8d3f-d87fe74da7d4" />
</p>



---

## 5. Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

**Yêu cầu môi trường:** Docker Engine 20.10+ và Docker Compose V2 (khuyến nghị). Nếu chạy cục bộ, cần Node.js v18+ và MySQL 8.0.

### 5.1. Phương thức 1: Triển khai bằng Docker Compose (Khuyên dùng)

**Bước 1: Clone dự án về máy**

```bash
git clone https://github.com/hinamikochi/Clinic_Booking_Project.git
cd Clinic_Booking_Project
```

**Bước 2: Khởi chạy hệ thống**

```bash
docker compose up -d --build
```

Lệnh trên sẽ xây dựng các image cần thiết và khởi chạy các dịch vụ theo cấu hình Docker Compose.

**Bước 3: Truy cập hệ thống**

| Thành phần                  | Địa chỉ / Cổng        |
| :-------------------------- | :-------------------- |
| Frontend (Nginx Web Server) | http://localhost:8080 |
| Backend API                 | http://localhost:5001 |
| MySQL Database              | `localhost:3306`      |

### 5.2. Phương thức 2: Chạy trong môi trường phát triển cục bộ (Local Development)

**Bước 1: Cấu hình cơ sở dữ liệu MySQL**

* Tạo cơ sở dữ liệu `clinic_db` trên MySQL local.
* Import cấu trúc và dữ liệu mẫu từ tệp `clinic_db_clean.sql`.
* Kiểm tra cấu hình kết nối cơ sở dữ liệu trong tệp môi trường của Backend.

**Bước 2: Khởi chạy Backend**

Mở terminal tại thư mục gốc của dự án và thực hiện:

```bash
cd backend
npm install
npm start
```

Backend Express.js sẽ chạy tại `http://localhost:5001` nếu cấu hình cổng mặc định được giữ nguyên.

**Bước 3: Khởi chạy Frontend**

Mở một terminal khác tại thư mục gốc của dự án và thực hiện:

```bash
cd frontend
npm install
npm run dev
```

Frontend ReactJS sẽ chạy tại `http://localhost:5173` theo cấu hình Vite mặc định.

---

## 6. Biến Môi trường (Environment Variables)

Tệp cấu hình biến môi trường cho Frontend: `frontend/.env`.

```env
VITE_API_URL=http://localhost:5001
```

**Lưu ý:** Giá trị `VITE_API_URL` phải phù hợp với cấu hình API của Backend và cách triển khai hệ thống. Khi chạy bằng Docker, hãy kiểm tra cấu hình Nginx và biến môi trường tương ứng để bảo đảm Frontend có thể gửi yêu cầu đến Backend.

---

## 7. Danh sách RESTful API Chính (API Reference)

Bảng dưới đây liệt kê một số API tiêu biểu của hệ thống.

| Phương thức | Endpoint                             | Mô tả                                                   | Quyền truy cập   |
| :---------- | :----------------------------------- | :------------------------------------------------------ | :--------------- |
| `POST`      | `/api/auth/login`                    | Đăng nhập hệ thống và nhận JWT Token                    | Public           |
| `GET`       | `/api/specialties`                   | Lấy danh sách chuyên khoa và thông tin bác sĩ           | Public           |
| `POST`      | `/api/appointments`                  | Tạo phiếu đặt lịch khám mới                             | Public / Patient |
| `GET`       | `/api/patient/appointments/:userId`  | Lấy danh sách lịch hẹn của bệnh nhân                    | Patient          |
| `POST`      | `/api/medical-records`               | Lưu chẩn đoán, đơn thuốc và cập nhật trạng thái ca khám | Doctor / Admin   |
| `PUT`       | `/api/admin/appointments/:id/status` | Phê duyệt hoặc hủy lịch hẹn khám                        | Admin            |


