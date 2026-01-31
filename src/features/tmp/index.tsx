import { useEffect } from "react";

export const Tmp = () => {
  useEffect(() => {
    console.log("hello world");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <h1 className="font-bold text-4xl text-gray-900">Todo App</h1>
    </div>
  );
};
