"use client";

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useCompanyStore, type Company } from "../../stores/companyStore";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CompanySelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  
  const { 
    companies, 
    currentCompany, 
    setCurrentCompany, 
    loading,
    fetchCompanies 
  } = useCompanyStore();

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies().catch((error) => {
      toast.error('Failed to load companies');
      console.error('Error fetching companies:', error);
    });
  }, [fetchCompanies]);

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleCompanySelect = async (company: Company) => {
    try {
      await setCurrentCompany(company);
      setOpen(false);
      
      // Navigate to the company workspace
      const currentWorkspaceId = localStorage.getItem(`lastWorkspace_${company.id}`) || 'default';
      router.push(`/company/${company.id}/workspace/${currentWorkspaceId}`);
      
      toast.success(`Switched to ${company.name}`);
    } catch (error) {
      toast.error('Failed to switch company');
      console.error('Error switching company:', error);
    }
  };

  const handleCreateCompany = () => {
    setOpen(false);
    router.push('/company/create');
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select company"
          className="w-[200px] justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {currentCompany ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={currentCompany.logo} alt={currentCompany.name} />
                <AvatarFallback className="text-xs">
                  {getCompanyInitials(currentCompany.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{currentCompany.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select company...</span>
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" align="start">
        <Command>
          <CommandInput 
            placeholder="Search company..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No company found.</CommandEmpty>
            <CommandGroup heading="Your Companies">
              {loading ? (
                <div className="py-6 text-center text-sm">Loading...</div>
              ) : (
                filteredCompanies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => handleCompanySelect(company)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={company.logo} alt={company.name} />
                        <AvatarFallback className="text-xs">
                          {getCompanyInitials(company.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{company.name}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            getRoleBadgeColor(company.role)
                          )}>
                            {company.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {company.slug && (
                            <span className="text-xs text-muted-foreground">
                              {company.slug}
                            </span>
                          )}
                          {company.memberCount && (
                            <span className="text-xs text-muted-foreground">
                              • {company.memberCount} members
                            </span>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          currentCompany?.id === company.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleCreateCompany}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Company
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
