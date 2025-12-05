import { Toaster } from "@/components/ui/sonner";
import { MainLayout } from "@/components/MainLayout";

function App() {
  return (
    <>
      <MainLayout />
      <Toaster position="top-right" />
    </>
  );
}

export default App;