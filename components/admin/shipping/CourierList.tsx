"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Pencil,
    Trash2,
    Truck,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
    createCourierPartner,
    updateCourierPartner,
    deleteCourierPartner,
    toggleCourierPartner,
    type CourierPartnerData,
} from "@/app/admin/shipping/couriers/actions";
import { useRouter } from "next/navigation";

interface CourierPartner {
    id: string;
    name: string;
    trackingUrlTemplate?: string | null;
    supportsCOD: boolean;
    supportsInternational: boolean;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

interface CourierListProps {
    initialPartners: CourierPartner[];
}

export default function CourierList({ initialPartners }: CourierListProps) {
    const router = useRouter();
    const [partners, setPartners] = useState<CourierPartner[]>(initialPartners);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<CourierPartner | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CourierPartnerData>({
        name: "",
        trackingUrlTemplate: "",
        supportsCOD: false,
        supportsInternational: false,
        isActive: true,
    });

    const handleAddNew = () => {
        setSelectedPartner(null);
        setFormData({
            name: "",
            trackingUrlTemplate: "",
            supportsCOD: false,
            supportsInternational: false,
            isActive: true,
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (partner: CourierPartner) => {
        setSelectedPartner(partner);
        setFormData({
            name: partner.name,
            trackingUrlTemplate: partner.trackingUrlTemplate || "",
            supportsCOD: partner.supportsCOD,
            supportsInternational: partner.supportsInternational,
            isActive: partner.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (partner: CourierPartner) => {
        setSelectedPartner(partner);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Partner name is required");
            return;
        }

        setIsLoading(true);
        try {
            let result;
            if (selectedPartner) {
                result = await updateCourierPartner(selectedPartner.id, formData);
            } else {
                result = await createCourierPartner(formData);
            }

            if (result.success) {
                toast.success(
                    selectedPartner
                        ? "Partner updated successfully"
                        : "Partner created successfully"
                );
                setIsDialogOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to save partner");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedPartner) return;

        setIsLoading(true);
        try {
            const result = await deleteCourierPartner(selectedPartner.id);
            if (result.success) {
                toast.success("Partner deleted successfully");
                setIsDeleteDialogOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete partner");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (partner: CourierPartner) => {
        try {
            const result = await toggleCourierPartner(partner.id);
            if (result.success) {
                toast.success(
                    partner.isActive
                        ? "Partner deactivated"
                        : "Partner activated"
                );
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update partner");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    return (
        <>
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-stone-600" />
                        <h3 className="text-lg font-semibold">Active Partners</h3>
                    </div>
                    <Button onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Partner
                    </Button>
                </div>

                {partners.length === 0 ? (
                    <div className="text-center py-12">
                        <Truck className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500 mb-4">No courier partners added yet</p>
                        <Button onClick={handleAddNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Partner
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>COD Support</TableHead>
                                <TableHead>International</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.map((partner) => (
                                <TableRow key={partner.id}>
                                    <TableCell className="font-medium">
                                        {partner.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={partner.isActive}
                                                onCheckedChange={() => handleToggle(partner)}
                                            />
                                            <Badge
                                                variant={partner.isActive ? "default" : "secondary"}
                                            >
                                                {partner.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {partner.supportsCOD ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Yes
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                                No
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {partner.supportsInternational ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                Yes
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                                No
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(partner)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(partner)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent aria-describedby="courier-dialog-description">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedPartner ? "Edit Partner" : "Add New Partner"}
                        </DialogTitle>
                        <p id="courier-dialog-description" className="sr-only">
                            {selectedPartner ? "Edit courier partner details" : "Add a new courier partner"}
                        </p>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Partner Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g., Delhivery, BlueDart, etc."
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="trackingUrl">Tracking URL Template</Label>
                            <Input
                                id="trackingUrl"
                                value={formData.trackingUrlTemplate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        trackingUrlTemplate: e.target.value,
                                    })
                                }
                                placeholder="https://example.com/track/{AWB_NUMBER}"
                                className="mt-1"
                            />
                            <p className="text-xs text-stone-500 mt-1">
                                Use {"{AWB_NUMBER}"} as placeholder for tracking number
                            </p>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <Label>COD Support</Label>
                                <p className="text-xs text-stone-500">
                                    Partner accepts Cash on Delivery
                                </p>
                            </div>
                            <Switch
                                checked={formData.supportsCOD}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, supportsCOD: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <Label>International Shipping</Label>
                                <p className="text-xs text-stone-500">
                                    Partner supports international delivery
                                </p>
                            </div>
                            <Switch
                                checked={formData.supportsInternational}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        supportsInternational: checked,
                                    })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div>
                                <Label>Active Status</Label>
                                <p className="text-xs text-stone-500">
                                    Enable this partner for shipments
                                </p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isActive: checked })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Partner"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent aria-describedby="delete-dialog-description">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Delete Courier Partner
                        </DialogTitle>
                        <p id="delete-dialog-description" className="text-sm text-stone-600 mt-2">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">{selectedPartner?.name}</span>?
                            This action cannot be undone.
                        </p>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Partner"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
