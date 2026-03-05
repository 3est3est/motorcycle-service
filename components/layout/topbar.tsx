"use client";

import { Search, Moon, Sun, Loader2, Hammer, User, Box, ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { RepairStatusModal } from "@/app/(dashboard)/dashboard/repair-status-modal";
import { useProfile } from "@/lib/hooks/use-profile";
import { NotificationCenter } from "@/components/shared/notification-center";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "REPAIR" | "CUSTOMER" | "PART";
}

interface TopBarProps {
  title: string;
  subtitle?: string;
  className?: string;
  backButton?: boolean;
}

export function TopBar({ title, subtitle, className, backButton }: TopBarProps) {
  const router = useRouter();
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<{ repairs: SearchResult[]; customers: SearchResult[]; parts: SearchResult[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useProfile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchValue.trim().length > 1) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/staff/search?q=${searchValue}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const toggleTheme = async () => {
    await fetch("/api/theme", { method: "POST" });
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSelectedRepairId(searchValue.trim());
      setShowResults(false);
    }
  };

  const ResultIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "REPAIR":
        return <Hammer className="w-3.5 h-3.5" />;
      case "CUSTOMER":
        return <User className="w-3.5 h-3.5" />;
      case "PART":
        return <Box className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchValue("");
    if (result.type === "REPAIR") setSelectedRepairId(result.id);
    else if (result.type === "CUSTOMER") router.push(`/users?search=${result.title}`);
    else if (result.type === "PART") router.push(`/parts?search=${result.title}`);
  };

  return (
    <>
      <header
        className={cn(
          "flex items-center justify-between px-6 py-4 mb-4",
          "lg:px-8 lg:h-20 lg:sticky lg:top-0 lg:z-30 lg:bg-background/40 lg:backdrop-blur-xl border-b border-white/5",
          className,
        )}
      >
        <div className="flex-1 flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            {backButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10 -ml-2 rounded-xl text-muted-foreground hover:bg-muted/50"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-2xl font-black tracking-tight text-foreground/90">{title}</h1>
          </div>
          {subtitle && (
            <p className={cn("text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40", backButton && "ml-11")}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div ref={searchRef} className="hidden md:flex flex-col relative w-80 group">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                )}
              </div>
              <Input
                placeholder="ติดตามงาน/ค้นหาด่วน..."
                onFocus={() => searchValue.length > 1 && setShowResults(true)}
                className="pl-12 pr-12 h-12 bg-muted/20 border-white/5 focus-visible:ring-1 focus-visible:ring-primary/20 text-[11px] font-black uppercase tracking-widest placeholder:text-muted-foreground/20 rounded-2xl shadow-inner transition-all group-hover:bg-muted/40"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 border border-muted-foreground/10 pointer-events-none">
                <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-tighter">CMD</span>
                <span className="text-[8px] font-black text-muted-foreground/40">K</span>
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && results && (
              <div className="absolute top-14 left-0 right-0 max-h-[480px] overflow-y-auto bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
                {Object.entries(results).map(([key, categoryResults]) => {
                  if (categoryResults.length === 0) return null;
                  const label = key === "repairs" ? "งานซ่อม" : key === "customers" ? "ชื่อลูกค้า" : "อะไหล่";
                  return (
                    <div key={key} className="mb-4 last:mb-0">
                      <p className="px-4 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{label}</p>
                      <div className="space-y-1">
                        {categoryResults.map((res: SearchResult) => (
                          <button
                            key={res.id}
                            onClick={() => handleResultClick(res)}
                            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 group/res transition-all text-left"
                          >
                            <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover/res:bg-primary/10 group-hover/res:text-primary transition-all">
                              <ResultIcon type={res.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black uppercase truncate group-hover/res:text-primary transition-colors">
                                {res.title}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest truncate">
                                {res.subtitle}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/res:opacity-40 group-hover/res:translate-x-0 transition-all text-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {results.repairs.length === 0 && results.customers.length === 0 && results.parts.length === 0 && (
                  <div className="py-8 text-center opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-widest">ไม่พบผลลัพธ์ที่ตรงกัน</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 text-muted-foreground hover:text-foreground active-prime"
              title="สลับโหมดสี"
            >
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 block dark:hidden" />
            </Button>

            {profile && <NotificationCenter userId={profile.id} />}
          </div>
        </div>
      </header>

      <RepairStatusModal repairId={selectedRepairId} onClose={() => setSelectedRepairId(null)} />
    </>
  );
}
