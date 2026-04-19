import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Award,
  CheckCircle,
  Upload,
  FileText,
  Video,
  Mic
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { supabase } from "../../supabaseClient";

type Project = {
  id: string;
  title: string;
  description: string;
  status: string;
  total_pay: number;
  submission_deadline: string;
  application_deadline: string;
};

const VERIFICATION_SCRIPT = "I hereby confirm that I am a legitimate developer and all information provided is accurate and truthful.";
const MATCH_THRESHOLD = 60;

export function DeveloperDashboard() {
  const navigate = useNavigate();

  const [verified, setVerified] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1); // 1 = document, 2 = video
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Step 2: Video verification
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [match, setMatch] = useState(0);

  // 🔐 Load developer data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        // ✅ Fetch developer verification + balance + earnings
        const { data: developer, error: devError } = await supabase
          .from("developers")
          .select("verify, available_balance, total_earned")
          .eq("id", user.id)
          .single();

        console.log("Developer data from database:", { developer, devError });

        if (!devError && developer) {
          console.log("Setting verification status to:", developer.verify);
          setVerified(developer.verify || false);
          setBalance(developer.available_balance || 0);
          setTotalEarned(developer.total_earned || 0);
        } else {
          console.log("Error fetching developer data:", devError);
        }

        // ✅ Fetch projects where user has submitted (active projects for the user)
        const today = new Date().toISOString();

        const { data: userSubmissions } = await supabase
          .from("submissions")
          .select("project_id")
          .eq("developer_id", user.id);

        if (userSubmissions && userSubmissions.length > 0) {
          const projectIds = userSubmissions.map((sub) => sub.project_id);

          const { data: activeProjects } = await supabase
            .from("projects")
            .select("id, title, description, status, total_pay, submission_deadline, application_deadline")
            .in("id", projectIds)
            .gte("submission_deadline", today)
            .order("submission_deadline", { ascending: true });

          setProjects(activeProjects || []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setTranscript(text);
      calculateMatch(text);
    };

    return () => {
      stopCamera();
    };
  }, []);

  // Match calculation
  function calculateMatch(spokenText: string) {
    const targetWords = VERIFICATION_SCRIPT.toLowerCase().split(" ");
    const spokenWords = spokenText.toLowerCase().split(" ");
    const matchedWords = targetWords.filter(word =>
      spokenWords.includes(word)
    ).length;
    const percentage = Math.round(
      (matchedWords / targetWords.length) * 100
    );
    setMatch(Math.min(100, percentage));
  }

  // Stop camera completely
  function stopCamera() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // Start recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      recorder.start();
      recognitionRef.current?.start();
      setRecording(true);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera/microphone. Please grant permissions.");
    }
  }

  // Stop recording
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    stopCamera();
    setRecording(false);
  }

  // Handle Step 1: Document Upload
  const handleDocumentSubmit = () => {
    if (!verificationFile) {
      alert("Please upload a verification document");
      return;
    }
    // Move to step 2
    setVerificationStep(2);
  };

  // Handle Step 2: Video Verification
  const handleVideoVerification = async () => {
    console.log("Starting verification process...");
    console.log("Current match percentage:", match);
    console.log("Required threshold:", MATCH_THRESHOLD);
    
    if (match < MATCH_THRESHOLD) {
      alert("Please read the script correctly to achieve the required match percentage.");
      return;
    }

    setVerifying(true);
    stopCamera();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("Authenticated user:", user?.id);

      if (!user) throw new Error("Not authenticated");

      // Update verification status
      console.log("Updating verification status in database...");
      console.log("User ID for update:", user.id);
      
      const { data, error } = await supabase
        .from("developers")
        .update({ verify: true })
        .eq("id", user.id)
        .select();

      console.log("Database update result:", { data, error });
      console.log("Update data length:", data?.length);

      if (error) {
        console.error("Database update error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("No rows were updated - possible RLS policy issue");
        throw new Error("No rows were updated. Check database permissions.");
      }

      console.log("Verification update successful! Updated rows:", data);
      
      // Wait a moment for database to sync, then refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh verification status from database to ensure UI updates
      const { data: refreshedDeveloper, error: refreshError } = await supabase
        .from("developers")
        .select("verify")
        .eq("id", user.id)
        .single();
      
      console.log("Refresh query result:", { refreshedDeveloper, refreshError });
      console.log("Refreshed verification status:", refreshedDeveloper?.verify);
      
      // Force set to true if database update was successful but refresh fails
      const isVerified = refreshedDeveloper?.verify || data.length > 0;
      console.log("Final verification status:", isVerified);
      setVerified(isVerified);
      setShowVerifyModal(false);
      setVerificationStep(1);
      setVerificationFile(null);
      setTranscript("");
      setMatch(0);
      alert("Verification successful! You are now a verified developer.");
    } catch (err) {
      console.error("Verification error:", err);
      alert("Failed to verify. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    stopCamera();
    setShowVerifyModal(false);
    setVerificationStep(1);
    setVerificationFile(null);
    setTranscript("");
    setMatch(0);
    setRecording(false);
  };

  // 💰 INR formatter
  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  // 📅 Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Workspace</h1>
          <p className="text-zinc-500 mt-2">
            Manage your active tasks and track your performance.
          </p>
        </div>

        {verified ? (
          <Badge className="py-2 px-4 bg-green-100 text-green-700 text-sm font-medium">
            ✅ Verified Developer
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowVerifyModal(true)}
            className="shadow-sm"
          >
            Verify Identity
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Available Balance</p>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatINR(balance)}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Total Earned</p>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatINR(totalEarned)}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Active Projects</p>
                  <div className="text-2xl font-bold text-zinc-900">
                    {projects.length}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Urgent Task Highlight */}
      {projects.length > 0 && getDaysRemaining(projects[0].submission_deadline) <= 7 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-red-500 shadow-lg bg-gradient-to-r from-red-50 to-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="warning" className="animate-pulse bg-red-100 text-red-700">
                      🔥 Urgent - {getDaysRemaining(projects[0].submission_deadline)} days left
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                    {projects[0].title}
                  </h3>

                  <p className="text-zinc-600 mb-3">
                    {projects[0].description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {formatDate(projects[0].submission_deadline)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatINR(projects[0].total_pay)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px]">
                  <Button
                    size="lg"
                    className="w-full justify-between group bg-zinc-900 hover:bg-zinc-800"
                    onClick={() =>
                      navigate(`/developer/active-work/${projects[0].id}`)
                    }
                  >
                    Continue Work
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            Active Projects
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/developer/explore-projects")}
          >
            Explore Projects
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="h-[400px]">
            <CardContent className="p-12 text-center h-full flex flex-col justify-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                No Active Projects
              </h3>
              <p className="text-zinc-500 mb-4">
                Start applying to projects to see them here
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate("/developer/explore-projects")}
                  className="w-fit px-4 py-2 text-sm"
                >
                  Browse Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-96 overflow-y-auto overflow-x-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project, index) => {
                const daysRemaining = getDaysRemaining(project.submission_deadline);
                const isUrgent = daysRemaining <= 3;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() =>
                      navigate("/developer/my-applications")
                    }
                    className="cursor-pointer"
                  >
                    <Card className={`hover:border-zinc-400 transition-all h-48 ${
                      isUrgent ? 'border-l-4 border-l-orange-500' : ''
                    }`}>
                      <CardContent className="p-3 flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-zinc-900 text-sm line-clamp-1">
                              {project.title}
                            </h4>
                            {isUrgent && (
                              <Badge variant="warning" className="text-xs bg-orange-100 text-orange-700 whitespace-nowrap">
                                Due Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-600 line-clamp-2 mb-2">
                            {project.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-zinc-500">
                              <Calendar className="w-3 h-3" />
                              {daysRemaining}d left
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {project.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-600">Budget</span>
                            <span className="font-bold text-zinc-900 text-sm">
                              {formatINR(project.total_pay)}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            className="w-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/developer/my-applications");
                            }}
                          >
                            Continue Work
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TWO-STEP VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`flex items-center gap-2 ${verificationStep === 1 ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  verificationStep === 1 ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {verificationStep === 1 ? '1' : <CheckCircle className="w-5 h-5" />}
                </div>
                <span className="text-sm font-medium">Document</span>
              </div>
              
              <div className="w-12 h-0.5 bg-zinc-300"></div>
              
              <div className={`flex items-center gap-2 ${verificationStep === 2 ? 'text-blue-600' : 'text-zinc-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  verificationStep === 2 ? 'bg-blue-100' : 'bg-zinc-100'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Video</span>
              </div>
            </div>

            {/* STEP 1: Document Upload */}
            {verificationStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Step 1: Upload Document
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Upload a government-issued ID
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-zinc-400 transition-colors">
                    <input
                      type="file"
                      id="verification-file"
                      accept="image/*,.pdf"
                      onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="verification-file"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {verificationFile ? (
                        <>
                          <FileText className="w-8 h-8 text-green-600" />
                          <p className="text-sm font-medium text-zinc-900">
                            {verificationFile.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Click to change file
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-zinc-400" />
                          <p className="text-sm font-medium text-zinc-900">
                            Click to upload
                          </p>
                          <p className="text-xs text-zinc-500">
                            PNG, JPG or PDF (max 5MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      <strong>Acceptable documents:</strong> Passport, Driver's License,
                      National ID Card, or any government-issued photo ID
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleDocumentSubmit}
                      disabled={!verificationFile}
                    >
                      Next: Video Verification
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Video Verification */}
            {verificationStep === 2 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Step 2: Video Verification
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Record yourself reading the statement
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-100 p-4 rounded-lg">
                    <p className="text-sm text-zinc-600 mb-2">Read this statement clearly:</p>
                    <p className="font-medium text-zinc-900">
                      {VERIFICATION_SCRIPT}
                    </p>
                  </div>

                  {/* Video Feed */}
                  <div className="flex justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full max-w-md rounded-lg border-2 border-zinc-300"
                    />
                  </div>

                  {/* Live Transcript */}
                  {recording && (
                    <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-red-600 animate-pulse" />
                        <span className="text-sm font-medium text-zinc-700">Live Transcript</span>
                      </div>
                      <p className="text-sm text-zinc-600 min-h-[60px]">
                        {transcript || "Start speaking..."}
                      </p>
                    </div>
                  )}

                  {/* Match Percentage */}
                  <div className="text-center">
                    <p className="text-sm text-zinc-600 mb-2">Match Accuracy</p>
                    <div className="text-3xl font-bold">
                      <span className={match >= MATCH_THRESHOLD ? "text-green-600" : "text-zinc-800"}>
                        {match}%
                      </span>
                    </div>
                    {match >= MATCH_THRESHOLD && (
                      <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Script verified! You can submit now.
                      </p>
                    )}
                  </div>

                  {/* Recording Controls */}
                  <div className="flex gap-3">
                    {!recording ? (
                      <Button
                        className="flex-1"
                        onClick={startRecording}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={stopRecording}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        stopCamera();
                        setVerificationStep(1);
                        setTranscript("");
                        setMatch(0);
                        setRecording(false);
                      }}
                      disabled={verifying}
                    >
                      Back
                    </Button>

                    <Button
                      className="flex-1"
                      disabled={verifying || match < MATCH_THRESHOLD}
                      onClick={handleVideoVerification}
                    >
                      {verifying ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                          Verifying...
                        </span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Verification
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
