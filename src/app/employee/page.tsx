"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import Image from next/image
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Leave = {
  leave_type_id: string;
  total: number;
  taken: number;
  remaining: number;
  leave_types: { name: string } | null;
};
type Request = {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  status: string;
  manager_feedback: string | null;
  message: string | null;
  leave_types: { name: string } | null;
};
type Holiday = {
  date: string;
  name: string;
};
type LeaveType = {
  id: string;
  name: string;
};

export default function EmployeeDashboard() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [greeting, setGreeting] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        // Set greeting based on time (IST: 01:10 AM, May 29, 2025)
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 12) setGreeting("Good Morning");
        else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
        else if (hour >= 17 && hour < 20) setGreeting("Good Evening");
        else setGreeting("Good Night");

        // Use email as name for now (e.g., "alice" from "alice@company.com")
        setUserName(user.email?.split("@")[0] || "Employee");

        // Fetch leave balances
        const { data: leavesData, error: leavesError } = await supabase
          .from("leaves")
          .select("*, leave_types!inner(name)")
          .eq("user_id", user.id);
        if (leavesError) throw new Error(leavesError.message);
        setLeaves(leavesData || []);

        // Fetch leave requests
        const { data: requestsData, error: requestsError } = await supabase
          .from("requests")
          .select("*, leave_types!inner(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (requestsError) throw new Error(requestsError.message);
        setRequests(requestsData || []);

        // Fetch holidays
        const { data: holidaysData, error: holidaysError } = await supabase
          .from("holidays")
          .select("*")
          .order("date", { ascending: true });
        if (holidaysError) throw new Error(holidaysError.message);
        setHolidays(holidaysData || []);

        // Fetch eligible leave types
        const { data: eligibleData, error: eligibleError } = await supabase
          .from("employee_leave_types")
          .select("leave_type_id")
          .eq("employee_id", user.id)
          .eq("is_eligible", true);
        if (eligibleError) throw new Error(eligibleError.message);
        const eligibleIds = eligibleData?.map((elt) => elt.leave_type_id) || [];

        // Fetch leave types for dropdown
        const { data: leaveTypesData, error: leaveTypesError } = await supabase
          .from("leave_types")
          .select("*")
          .in("id", eligibleIds);
        if (leaveTypesError) throw new Error(leaveTypesError.message);
        setLeaveTypes(leaveTypesData || []);
      } catch (err) {
        setError("Failed to load data: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!startDate || !endDate || !leaveTypeId) {
      setError("Please select start date, end date, and leave type");
      setLoading(false);
      return;
    }

    if (endDate < startDate) {
      setError("End date must be after start date");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check for holiday conflicts
      const holidayDates = holidays.map((h) => new Date(h.date));
      if (holidayDates.some((h) => startDate <= h && h <= endDate)) {
        setError("Selected dates conflict with company holidays");
        setLoading(false);
        return;
      }

      // Calculate leave days (simple: end - start + 1)
      const days =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        ) + 1;

      // Check available balance
      const leave = leaves.find((l) => l.leave_type_id === leaveTypeId);
      if (!leave || leave.remaining < days) {
        setError("Insufficient leave balance");
        setLoading(false);
        return;
      }

      // Upload file to Supabase Storage if provided
      let fileUrl: string | null = null;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("leave-files")
          .upload(fileName, file);
        if (uploadError)
          throw new Error("File upload failed: " + uploadError.message);
        fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/leave-files/${fileName}`;
      }

      // Insert leave request
      const { error: requestError } = await supabase.from("requests").insert({
        user_id: user.id,
        leave_type_id: leaveTypeId,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        message,
        file_url: fileUrl,
        status: "pending",
      });

      if (requestError) throw new Error(requestError.message);

      setSuccess("Leave request submitted successfully!");
      setStartDate(undefined);
      setEndDate(undefined);
      setLeaveTypeId("");
      setMessage("");
      setFile(null);

      // Refresh requests
      const { data: requestsData } = await supabase
        .from("requests")
        .select("*, leave_types!inner(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(requestsData || []);
    } catch (err) {
      setError("Failed to submit request: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Image
            src="/vivant_logo.avif"
            alt="Company Logo"
            className="h-8 mr-2"
            width={150}
            height={40}
            priority
          />
        </div>
        <Button
          onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
        >
          Logout
        </Button>
      </div>
      <div className="flex justify-start items-center mb-2">
        <h1 className="text-2xl font-bold">
          {greeting}, {userName}!
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Leave Balances */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
              {leaves.map((leave) => (
                <Card
                  key={leave.leave_type_id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <h3 className="font-semibold text-sm">
                    {leave.leave_types?.name || "Unknown"}
                  </h3>
                  <p className="text-xs">Total: {leave.total} days</p>
                  <p className="text-xs">Taken: {leave.taken} days</p>
                  <p className="text-xs">Remaining: {leave.remaining} days</p>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Apply for Leave and Leave History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Apply for Leave */}
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-3">
                <div>
                  <Label htmlFor="leave-type" className="text-sm">
                    Leave Type
                  </Label>
                  <select
                    id="leave-type"
                    value={leaveTypeId}
                    onChange={(e) => setLeaveTypeId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      align="start"
                      sideOffset={5}
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={holidays.map((h) => new Date(h.date))}
                        initialFocus
                        classNames={{
                          day_disabled:
                            "text-muted-foreground opacity-50 cursor-not-allowed",
                          day: "h-9 w-9 p-0 font-normal rounded-full hover:bg-primary hover:text-primary-foreground transition-colors",
                          day_selected: "bg-primary text-primary-foreground",
                          cell: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-sm">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      align="start"
                      sideOffset={5}
                    >
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={holidays.map((h) => new Date(h.date))}
                        initialFocus
                        classNames={{
                          day_disabled:
                            "text-muted-foreground opacity-50 cursor-not-allowed",
                          day: "h-9 w-9 p-0 font-normal rounded-full hover:bg-primary hover:text-primary-foreground transition-colors",
                          day_selected: "bg-primary text-primary-foreground",
                          cell: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="message" className="text-sm">
                    Message (Optional)
                  </Label>
                  <Input
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-1.5 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="file" className="text-sm">
                    Upload File (Optional)
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full p-1.5 text-sm"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-sm py-2"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leave History */}
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">Leave Type</TableHead>
                    <TableHead className="text-sm">Start Date</TableHead>
                    <TableHead className="text-sm">End Date</TableHead>
                    <TableHead className="text-sm">Status</TableHead>
                    <TableHead className="text-sm">Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-sm">
                        {req.leave_types?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {req.start_date}
                      </TableCell>
                      <TableCell className="text-sm">{req.end_date}</TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={
                            req.status === "approved"
                              ? "text-green-600"
                              : req.status === "rejected"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {req.manager_feedback || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holidays */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Company Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">Date</TableHead>
                <TableHead className="text-sm">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.date}>
                  <TableCell className="text-sm">{holiday.date}</TableCell>
                  <TableCell className="text-sm">{holiday.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
