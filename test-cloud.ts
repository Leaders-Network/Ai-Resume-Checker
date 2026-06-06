import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dqdfmaevw",
  api_key: "823676572886745",
  api_secret: "qRHcJhEiYKpc0EiJmjNJ6_Te12s",
});

const publicId = "resumes/Haleemah_Adeaga_CV_.pdf_qpigz5.pdf";

const signed = cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    version: "1780766658",
    sign_url: true,
    secure: true
});

const pvt = cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload"
});

console.log("Signed URL:", signed);
console.log("Private Download URL:", pvt);

// Let's test fetch
async function test() {
    const r1 = await fetch(signed);
    console.log("Signed URL fetch:", r1.status);
    
    const r2 = await fetch(pvt);
    console.log("Private URL fetch:", r2.status);
}

test();
