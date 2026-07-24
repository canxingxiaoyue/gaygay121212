import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF9F6] dark:bg-[#1F1512] p-4 font-sans">
      {/* Nhúng font chữ tròn trịa cho giao diện đăng nhập mượt mà */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap');
        .cl-rootBox {
          font-family: 'Quicksand', sans-serif !important;
        }
      `}} />
      <SignIn />
    </div>
  )
}