"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

function Chai() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="h-full flex flex-col justify-center items-center border-2">
      chai
      <button className="bg-blue-600 px-4 py-8 my-8 hover:bg-red-700  ">
        {date?.toLocaleDateString()}
      </button>
      <Button variant={"destructive"}>Shadcn</Button>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    </div>
  );
}

export default Chai;
