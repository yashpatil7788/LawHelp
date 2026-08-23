import { useState } from "react";
import Navbar from "./Navbar";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPenLine,
  FileText,
  Landmark,
  Scale,
  ShieldCheck,
} from "lucide-react";

const tools = [
  { id: "rti", label: "RTI drafter", icon: ClipboardPenLine },
  { id: "rights", label: "Rights navigator", icon: Scale },
  { id: "schemes", label: "Scheme checker", icon: Landmark },
  { id: "forms", label: "Form filler", icon: FileText },
];

const rightsGuides = {
  Tenant: {
    title: "Tenant dispute",
    summary: "Keep your agreement, payment records, notices, and repair requests together.",
    steps: [
      "Ask for the issue and requested remedy in writing.",
      "Check the rental agreement and applicable state rules.",
      "Document unsafe conditions with dated photos and receipts.",
      "Use a local rent authority or legal aid service if the issue continues.",
    ],
  },
  Consumer: {
    title: "Consumer complaint",
    summary: "You can seek a refund, replacement, repair, or compensation when a seller or service provider fails to deliver fairly.",
    steps: [
      "Collect the invoice, warranty, payment proof, and communication.",
      "Send a clear written request to the seller or service provider.",
      "Record the response and the date the problem occurred.",
      "Escalate through the National Consumer Helpline or consumer commission.",
    ],
  },
  Workplace: {
    title: "Workplace issue",
    summary: "Employment rights depend on your role, contract, state, and the nature of the conduct.",
    steps: [
      "Write down dates, people involved, and what happened.",
      "Keep payslips, appointment letters, policies, and messages.",
      "Use the internal grievance or prevention committee where appropriate.",
      "Seek labour department or legal aid guidance before signing a settlement.",
    ],
  },
};

const schemes = {
  "PM-KISAN": {
    description: "Income support for eligible landholding farmer families.",
    questions: ["Are you a landholding farmer family?", "Is the land record in your name?", "Are you excluded government employees or income-tax payers?"],
  },
  "Ayushman Bharat": {
    description: "Health cover for eligible families listed under the scheme criteria.",
    questions: ["Is your family listed in the eligibility database?", "Do you have an identity document?", "Are you seeking treatment at an empanelled hospital?"],
  },
  "Scholarship support": {
    description: "Education assistance varies by state, course, income, and category.",
    questions: ["Are you enrolled in an eligible course?", "Is your household income within the scheme limit?", "Do you have the required certificates?"],
  },
};

function ResultPanel({ title, children }) {
  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={18} className="text-teal-600" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="bg-slate-50 border border-slate-200 p-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {children}
      </div>
    </section>
  );
}

function CivicTools() {
  const [activeTool, setActiveTool] = useState("rti");
  const [rti, setRti] = useState({ name: "", address: "", department: "", question: "" });
  const [rtiDraft, setRtiDraft] = useState("");
  const [rightsType, setRightsType] = useState("Tenant");
  const [scheme, setScheme] = useState("PM-KISAN");
  const [answers, setAnswers] = useState({});
  const [schemeResult, setSchemeResult] = useState("");
  const [form, setForm] = useState({ name: "", issue: "", authority: "", documents: "" });
  const [formDraft, setFormDraft] = useState("");

  const update = (setter, field, value) => setter((current) => ({ ...current, [field]: value }));

  const createRtiDraft = () => {
    setRtiDraft(`To,\nThe Public Information Officer\n${rti.department || "[Department / Public Authority]"}\n\nSubject: Request for information under the Right to Information Act, 2005\n\nRespected Sir/Madam,\n\nI, ${rti.name || "[Applicant name]"}, residing at ${rti.address || "[Applicant address]"}, request the following information under the Right to Information Act, 2005:\n\n1. ${rti.question || "[Write one specific question and mention the relevant period]"}\n\nPlease provide the information in electronic form where available. If another public authority holds this information, kindly transfer this application as permitted by law and inform me.\n\nApplicant details:\nName: ${rti.name || "[Applicant name]"}\nAddress: ${rti.address || "[Applicant address]"}\nDate: ${new Date().toLocaleDateString()}\n\nSignature\n${rti.name || "[Applicant name]"}`);
  };

  const checkScheme = () => {
    const selected = schemes[scheme];
    const yesCount = selected.questions.filter((_, index) => answers[index] === "yes").length;
    setSchemeResult(yesCount === selected.questions.length
      ? "Your answers match the basic screening criteria. Verify documents, current rules, and application dates with the official scheme portal."
      : "You may need more information before applying. Check the unanswered or negative criteria with the official scheme portal or a local help centre.");
  };

  const createFormDraft = () => {
    setFormDraft(`Applicant: ${form.name || "[Your name]"}\nAuthority: ${form.authority || "[Department or office]"}\n\nSubject: Request for assistance regarding ${form.issue || "[briefly describe your issue]"}\n\nI am requesting assistance with the matter described above. Please review my request, tell me if any additional information is required, and provide the next available step or form.\n\nDocuments attached:\n${form.documents || "[List supporting documents]"}\n\nDate: ${new Date().toLocaleDateString()}\nContact details: [Add phone or email]`);
  };

  const renderTool = () => {
    if (activeTool === "rti") return (
      <div>
        <p className="text-sm text-slate-600 mb-5">Turn a plain-language information need into a structured RTI application.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Applicant name" value={rti.name} onChange={(e) => update(setRti, "name", e.target.value)} />
          <input className="field" placeholder="Public authority or department" value={rti.department} onChange={(e) => update(setRti, "department", e.target.value)} />
          <input className="field md:col-span-2" placeholder="Applicant address" value={rti.address} onChange={(e) => update(setRti, "address", e.target.value)} />
          <textarea className="field md:col-span-2 min-h-32" placeholder="What information do you need? Include dates, place, scheme, or reference number." value={rti.question} onChange={(e) => update(setRti, "question", e.target.value)} />
        </div>
        <button className="primary-button mt-4" onClick={createRtiDraft}><ClipboardPenLine size={17} /> Create RTI draft</button>
        {rtiDraft && <ResultPanel title="Draft application"><div>{rtiDraft}</div></ResultPanel>}
      </div>
    );

    if (activeTool === "rights") {
      const guide = rightsGuides[rightsType];
      return (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">{Object.keys(rightsGuides).map((type) => <button key={type} className={`choice ${rightsType === type ? "choice-active" : ""}`} onClick={() => setRightsType(type)}>{type}</button>)}</div>
          <h3 className="text-xl font-semibold text-slate-800">{guide.title}</h3>
          <p className="text-slate-600 mt-2">{guide.summary}</p>
          <ol className="mt-5 space-y-3">{guide.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm text-slate-700"><span className="number">{index + 1}</span><span>{step}</span></li>)}</ol>
          <div className="mt-6 flex gap-2 items-start text-xs text-slate-500"><ShieldCheck size={16} className="text-teal-600 shrink-0" /> This is a starting guide, not a substitute for advice from a qualified local professional.</div>
        </div>
      );
    }

    if (activeTool === "schemes") {
      const selected = schemes[scheme];
      return (
        <div>
          <select className="field mb-5" value={scheme} onChange={(e) => { setScheme(e.target.value); setAnswers({}); setSchemeResult(""); }}><option>PM-KISAN</option><option>Ayushman Bharat</option><option>Scholarship support</option></select>
          <p className="text-sm text-slate-600 mb-5">{selected.description}</p>
          <div className="space-y-4">{selected.questions.map((question, index) => <div key={question} className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">{question}</span><div className="flex gap-2"><button className={`choice ${answers[index] === "yes" ? "choice-active" : ""}`} onClick={() => setAnswers((current) => ({ ...current, [index]: "yes" }))}>Yes</button><button className={`choice ${answers[index] === "no" ? "choice-active" : ""}`} onClick={() => setAnswers((current) => ({ ...current, [index]: "no" }))}>No</button></div></div>)}</div>
          <button className="primary-button mt-6" onClick={checkScheme}><Landmark size={17} /> Check basic eligibility</button>
          {schemeResult && <ResultPanel title="Screening result">{schemeResult}</ResultPanel>}
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm text-slate-600 mb-5">Answer a few prompts and get a clean request you can submit to the relevant office.</p>
        <div className="grid gap-4 md:grid-cols-2"><input className="field" placeholder="Your name" value={form.name} onChange={(e) => update(setForm, "name", e.target.value)} /><input className="field" placeholder="Department or authority" value={form.authority} onChange={(e) => update(setForm, "authority", e.target.value)} /><textarea className="field md:col-span-2 min-h-28" placeholder="What do you need help with?" value={form.issue} onChange={(e) => update(setForm, "issue", e.target.value)} /><textarea className="field md:col-span-2 min-h-24" placeholder="Supporting documents you have" value={form.documents} onChange={(e) => update(setForm, "documents", e.target.value)} /></div>
        <button className="primary-button mt-4" onClick={createFormDraft}><FileText size={17} /> Prepare request</button>
        {formDraft && <ResultPanel title="Prepared request">{formDraft}</ResultPanel>}
      </div>
    );
  };

  return <div className="min-h-screen bg-slate-50"><Navbar /><main className="max-w-6xl mx-auto px-4 py-8"><div className="flex flex-col lg:flex-row gap-8"><aside className="lg:w-64 shrink-0"><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Civic access</p><h1 className="text-3xl font-bold text-slate-900 mt-2">Rights, made actionable.</h1><p className="text-sm text-slate-600 mt-3">Move from a confusing problem to a practical next step.</p><nav className="mt-8 space-y-2">{tools.map(({ id, label, icon: Icon }) => <button key={id} className={`w-full flex items-center justify-between gap-3 px-3 py-3 text-left text-sm border ${activeTool === id ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-700 border-slate-200 hover:border-teal-300"}`} onClick={() => setActiveTool(id)}><span className="flex items-center gap-3"><Icon size={18} />{label}</span><ArrowRight size={16} /></button>)}</nav></aside><section className="bg-white border border-slate-200 p-5 md:p-8 flex-1 min-w-0"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-teal-50 flex items-center justify-center"><FileText className="text-teal-700" size={20} /></div><div><h2 className="text-xl font-semibold text-slate-900">{tools.find((tool) => tool.id === activeTool).label}</h2><p className="text-xs text-slate-500">Indian civic and legal information workflow</p></div></div>{renderTool()}</section></div></main></div>;
}

export default CivicTools;
