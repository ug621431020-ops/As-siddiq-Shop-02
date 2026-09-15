# คำแนะนำการ Deploy บน Vercel (Vercel Deployment Guide)

ระบบนี้ได้รับการตั้งค่าให้รองรับการ Deploy บน **Vercel** ได้โดยตรงแบบ 100% พร้อม Serverless Function สำหรับรับข้อมูลอัปโหลดหลักฐาน

---

### วิธีการ Deploy ขึ้น Vercel

#### วิธีที่ 1: Deploy ผ่าน GitHub (แนะนำ สะดวกที่สุด)
1. นำโค้ดโปรเจกต์นี้ Push ขึ้นไปที่ GitHub Repository ของคุณ
2. เข้าสู่ระบบที่ [vercel.com](https://vercel.com)
3. กดปุ่ม **"Add New..."** -> **"Project"**
4. เลือก Repository ที่เพิ่ง Push ขึ้นไป
5. Vercel จะตรวจพบการตั้งค่าจาก `vercel.json` โดยอัตโนมัติ:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. กดปุ่ม **"Deploy"** รอระบบประมวลผลประมาณ 1-2 นาที พร้อมใช้งานทันที

#### วิธีที่ 2: Deploy ผ่าน Vercel CLI
ติดตั้งและรันคำสั่งในเทอร์มินัล:
```bash
npm install -g vercel
vercel
```
เมื่อต้องการขึ้น Production ให้รัน:
```bash
vercel --prod
```

---

### โครงสร้างที่เตรียมไว้สำหรับ Vercel
1. **`vercel.json`**:
   - กำหนด Build Command (`npm run build`) และ Output (`dist`)
   - กำหนด Routing Rewrite สำหรับ Single Page Application (SPA Fallback)
   - กำหนดให้ `/api/*` เรียกใช้งาน Vercel Serverless Functions
2. **`api/upload.ts`**:
   - Vercel Serverless Function สำหรับรับข้อมูลภาพ/วิดีโอหลักฐานการแพ็คพัสดุ (รองรับทั้ง JSON และ Multipart) พร้อม CORS Headers
3. **`api/health.ts`**:
   - Health check endpoint สำหรับตรวจสอบสถานะของ API บน Vercel
4. **`firebase-applet-config.json` & Environment Variables**:
   - รองรับการดึงการตั้งค่า Firebase ทั้งจากไฟล์ config และจาก Vercel Environment Variables (`VITE_FIREBASE_*`)

---

### ข้อควรทราบสำหรับการใช้งาน Google Sign-In บนโดเมน Vercel
หากใช้งานการล็อกอิน Google (Google Drive / Calendar) เมื่อได้โดเมนจาก Vercel แล้ว (เช่น `your-app.vercel.app`):
1. ไปที่ **Firebase Console** (โครงการของคุณ)
2. เมนูด้านซ้ายเลือก **Authentication** -> แท็บ **Settings**
3. เลือกหัวข้อ **Authorized domains** (โดเมนที่ได้รับอนุญาต)
4. กด **Add domain** แล้วใส่โดเมนของ Vercel (เช่น `your-app.vercel.app`)
5. บันทึก เพียงเท่านี้ก็จะสามารถเข้าสู่ระบบด้วย Google บนโดเมน Vercel ได้ทันที
