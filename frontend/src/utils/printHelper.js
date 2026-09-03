export const printPrescription = (apt, record) => {
  if (!apt) return;
  const printWindow = window.open('', '_blank');
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Phiếu Khám Bệnh & Đơn Thuốc - LH-${apt.id}</title>
      <style>
  @page {
    size: A4;
    margin: 12mm;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    padding: 20px;
    color: #2d2d2a;
    line-height: 1.5;
  }

  .header {
    text-align: center;
    border-bottom: 2px solid #5a5a40;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .clinic-name {
    font-size: 22px;
    font-weight: bold;
    color: #5a5a40;
    text-transform: uppercase;
  }

  .clinic-sub {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
  }

  .title {
    font-size: 20px;
    font-weight: bold;
    color: #2d2d2a;
    margin-top: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    background: #fdfbf7;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #e6e6df;
    margin-bottom: 14px;
  }

  .info-item {
    font-size: 14px;
  }

  .info-label {
    font-weight: bold;
    color: #5a5a40;
  }

  .section-box {
    border: 1px solid #e6e6df;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 14px;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 15px;
    font-weight: bold;
    color: #5a5a40;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .prescription-text {
    white-space: pre-line;
    font-size: 14px;
    background: #fff;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #f0f0ea;
  }

  .footer-sign {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    text-align: center;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .sign-box {
    width: 220px;
  }

  .sign-title {
    font-weight: bold;
    font-size: 14px;

    margin-bottom: 40px;
  }

  @media print {
    body {
      padding: 0;
      margin: 0;
    }

    .no-print {
      display: none;
    }

    .footer-sign {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .section-box {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name"> HỆ THỐNG Y TẾ PHÒNG KHÁM MyClinic CARE</div>
        <div class="clinic-sub">Địa chỉ: 144 Xuân Thủy, Cầu Giấy, Hà Nội • Hotline: 1900 8888 • Email: myclinic.care@gmail.com</div>
        <div class="title">PHIẾU KHÁM BỆNH & ĐƠN THUỐC ĐIỆN TỬ</div>
        <div style="font-size: 12px; color: #777; margin-top: 4px;">Mã phiếu hẹn: <b>LH-${apt.id}</b> | Ngày khám: <b>${apt.appointment_date}</b></div>
      </div>

      <div class="info-grid">
        <div class="info-item"><span class="info-label">Họ và tên bệnh nhân:</span> ${apt.patient_name}</div>
        <div class="info-item"><span class="info-label">Số điện thoại:</span> ${apt.patient_phone}</div>
        <div class="info-item"><span class="info-label">Giới tính:</span> ${apt.patient_gender || 'Nam'}</div>
        <div class="info-item"><span class="info-label">Tuổi:</span> ${apt.patient_age || '30'} tuổi</div>
        <div class="info-item"><span class="info-label">Bác sĩ khám:</span> ${apt.DoctorInfo?.User?.full_name || 'Bác sĩ chuyên khoa'}</div>
        <div class="info-item"><span class="info-label">Chuyên khoa:</span> ${apt.Specialty?.name || 'Đa khoa'}</div>
      </div>

      <div class="section-box">
        <div class="section-title">1. Chẩn Đoán Lâm Sàng Của Bác Sĩ</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d2d2a;">${record?.diagnosis || 'Không có chẩn đoán.'}</div>
      </div>

      <div class="section-box">
        <div class="section-title">2. Đơn Thuốc Kê Đơn & Hướng Dẫn Liều Dùng</div>
        <div class="prescription-text">${record?.prescription || 'Không có đơn thuốc chỉ định.'}</div>
      </div>

      <div class="section-box">
        <div class="section-title">3. Lời Dặn Bác Sĩ & Hẹn Tái Khám</div>
        <div style="font-size: 14px; font-style: italic;">"${record?.advice || 'Nghỉ ngơi và uống đủ nước ấm.'}"</div>
        <div style="font-size: 13px; font-weight: bold; color: #b84343; margin-top: 8px;">
           Ngày hẹn tái khám: ${record?.re_visit_date || 'Theo dõi sức khỏe tại nhà'}
        </div>
      </div>

      <div class="footer-sign">
        <div class="sign-box">
          <div style="font-size: 12px; color: #666;">Bệnh nhân ký tên</div>
          <div class="sign-title">BỆNH NHÂN</div>
          <div style="font-size: 13px; font-weight: bold;">${apt.patient_name}</div>
        </div>
        <div class="sign-box">
          <div style="font-size: 12px; color: #666;">Hà Nội, Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</div>
          <div class="sign-title">BÁC SĨ KHÁM BỆNH</div>
          <div style="font-size: 13px; font-weight: bold;">${apt.DoctorInfo?.User?.full_name || 'Bác sĩ chuyên khoa'}</div>
        </div>
      </div>

      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; background: #5a5a40; color: #fff; border: none; border-radius: 8px; cursor: pointer;"> In Đơn Thuốc Ngay</button>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
};