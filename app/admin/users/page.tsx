'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, MoreHorizontal, ShieldCheck, Mail } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminUsersPage() {
    // Mock data for display
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@vastraverse.com', role: 'Super Admin', status: 'Active', lastLogin: '2 mins ago' },
        { id: 2, name: 'Support Staff', email: 'support@vastraverse.com', role: 'Support', status: 'Active', lastLogin: '1 day ago' },
        { id: 3, name: 'Inventory Manager', email: 'stock@vastraverse.com', role: 'Editor', status: 'Inactive', lastLogin: '1 week ago' },
    ];

    return (
        <div className="p-6 space-y-6 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-indigo-600" />
                        Admin Users
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage team access and permissions
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>List of all users with admin access</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search users..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.status === 'Active' ? 'default' : 'secondary'}
                                            className={user.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : ''}
                                        >
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem>Change Permissions</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
