
import { useState, useEffect } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

const OrganizationSelector = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([
    { id: "1", name: "Acme Corp", slug: "acme-corp", plan: "pro" },
    { id: "2", name: "Tech Startup", slug: "tech-startup", plan: "free" }
  ]);
  const [currentOrg, setCurrentOrg] = useState<Organization>(organizations[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const { toast } = useToast();

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newOrg = {
      id: Date.now().toString(),
      name: newOrgName,
      slug: newOrgName.toLowerCase().replace(/\s+/g, '-'),
      plan: "free"
    };
    
    setOrganizations(prev => [...prev, newOrg]);
    setCurrentOrg(newOrg);
    setNewOrgName("");
    setIsCreating(false);
    
    toast({
      title: "Organization created",
      description: `${newOrgName} has been created successfully.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">{currentOrg.name}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrg(org)}
            className={currentOrg.id === org.id ? "bg-muted" : ""}
          >
            <div className="flex items-center justify-between w-full">
              <span>{org.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{org.plan}</span>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </DropdownMenuItem>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              
              <Button 
                onClick={handleCreateOrg} 
                disabled={!newOrgName.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSelector;
