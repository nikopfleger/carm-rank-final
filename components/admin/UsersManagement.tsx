"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useSessionUpdate } from "@/hooks/use-session-update";
import { canAssignAuthority, canAssignRole, canModifyUser, getAvailableAuthorities, getAvailableRoles, getRoleLevel, hasAuthority, mergeRoleAuthorities } from "@/lib/authorization";
import { UserRole } from "@prisma/client";
import { ChevronDown, LogOut } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UserRow {
	id: string;
	email: string;
	name: string | null;
	role: "OWNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
	authorities: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// Función para obtener etiquetas legibles de roles
const getRoleLabel = (role: string) => {
	switch (role) {
		case 'OWNER': return 'Propietario';
		case 'SUPER_ADMIN': return 'Super Administrador';
		case 'ADMIN': return 'Administrador';
		case 'MODERATOR': return 'Moderador';
		case 'USER': return 'Usuario';
		default: return role;
	}
};

export function UsersManagement() {
	const { data: session } = useSession();
	const { handleError, handleSuccess } = useErrorHandler();
	const { forceSessionUpdate } = useSessionUpdate();
	const [users, setUsers] = useState<UserRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
	const [savingId, setSavingId] = useState<string | null>(null);

	const canManageUsers = useMemo(() => {
		const role = session?.user?.role;
		const authorities = session?.user?.authorities || [];
		return role === "OWNER" || role === "SUPER_ADMIN" || role === "ADMIN" || hasAuthority(authorities, "USER_MANAGE");
	}, [session]);

	const currentUserRole = session?.user?.role as UserRole;
	const availableRoles = useMemo(() => getAvailableRoles(currentUserRole), [currentUserRole]);
	const availableAuthorities = useMemo(() => getAvailableAuthorities(currentUserRole), [currentUserRole]);

	const fetchUsers = useCallback(async () => {
		try {
			if (!canManageUsers) return;
			setLoading(true);
			const params = new URLSearchParams();
			if (query) params.set("q", query);
			if (activeFilter !== "all") params.set("active", String(activeFilter === "active"));
			const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
			if (res.ok) {
				const data = await res.json();
				setUsers(data.users as UserRow[]);
			} else {
				let errorData;
				try {
					errorData = await res.json();
				} catch {
					errorData = { message: `Error ${res.status}: ${res.statusText}` };
				}
				handleError(errorData, 'Cargar usuarios');
			}
		} catch (error) {
			handleError(error, 'Cargar usuarios');
		} finally {
			setLoading(false);
		}
	}, [query, activeFilter, canManageUsers, handleError]);

	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	async function invalidateUserSession(id: string) {
		setSavingId(id);
		try {
			const res = await fetch(`/api/admin/users/${id}/invalidate-session`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (res.ok) {
				const result = await res.json();
				handleSuccess(result.message, 'Sesión invalidada');
			} else {
				const error = await res.json();
				handleError(error, 'Invalidar sesión');
			}
		} catch (error) {
			handleError(error, 'Invalidar sesión');
		} finally {
			setSavingId(null);
		}
	}

	async function updateUser(id: string, payload: Partial<Pick<UserRow, "isActive" | "role" | "authorities">>) {
		setSavingId(id);
		try {
			const res = await fetch(`/api/admin/users/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (res.ok) {
				const { user } = await res.json();
				setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...user } : u)));

				// Si se cambió el rol o permisos del usuario actual, actualizar la sesión
				if (session?.user?.id === id && (payload.role || payload.authorities)) {
					await forceSessionUpdate();
				}

				// Mostrar mensaje de éxito
				if (payload.role) {
					const roleLabel = getRoleLabel(payload.role);
					handleSuccess(`Rol actualizado a ${roleLabel} con permisos por defecto. El usuario debe cerrar sesión y volver a iniciar sesión para ver los cambios.`, 'Usuario actualizado');
				} else if (payload.isActive !== undefined) {
					handleSuccess(`Usuario ${payload.isActive ? 'activado' : 'desactivado'}`, 'Estado actualizado');
				} else if (payload.authorities) {
					handleSuccess('Permisos actualizados', 'Usuario actualizado');
				}
			} else {
				const error = await res.json();
				handleError(error, 'Actualizar usuario');
			}
		} catch (error) {
			handleError(error, 'Actualizar usuario');
		} finally {
			setSavingId(null);
		}
	}

	// Función para manejar cambios en authorities
	const handleAuthorityChange = (userId: string, authority: string, checked: boolean) => {
		const user = users.find(u => u.id === userId);
		if (!user) return;

		const currentAuthorities = user.authorities || [];
		const newAuthorities = checked
			? [...currentAuthorities, authority]
			: currentAuthorities.filter(a => a !== authority);

		updateUser(userId, { authorities: newAuthorities });
	};

	if (!canManageUsers) {
		return (
			<Card className="m-4 p-6">
				<p>No tenés permisos para ver esta sección.</p>
			</Card>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">👥 Gestión de Usuarios</h2>
				<div className="text-sm text-gray-600">
					{users.filter(u => u.isActive).length} activos • {users.filter(u => !u.isActive).length} inactivos
				</div>
			</div>

			<Card className="p-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label htmlFor="search">Buscar</Label>
						<Input id="search" placeholder="email o nombre" value={query} onChange={(e) => setQuery(e.target.value)} />
					</div>
					<div>
						<Label htmlFor="active">Estado</Label>
						<Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "active" | "inactive")}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="active">Activos</SelectItem>
								<SelectItem value="inactive">Inactivos</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</Card>

			<Card className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Usuario</TableHead>
								<TableHead>Rol</TableHead>
								<TableHead>Authorities</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead>Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((u) => {
								const canModify = canModifyUser(currentUserRole, session?.user?.id || '', u.role, u.id);
								const canAssignThisRole = canAssignRole(currentUserRole, u.role);

								return (
									<TableRow key={u.id} className={!u.isActive ? "opacity-60" : undefined}>
										<TableCell>
											<div>
												<div className="font-medium">{u.email}</div>
												{u.name && <div className="text-sm text-gray-500">{u.name}</div>}
											</div>
										</TableCell>
										<TableCell>
											{canModify && canAssignThisRole ? (
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="min-w-[14rem] sm:w-[16rem] justify-between"
															disabled={savingId === u.id}
														>
															<span className="text-left flex-1">{getRoleLabel(u.role)}</span>
															<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-56 p-1 z-[9999]"
														align="start"
														side="bottom"
														sideOffset={4}
													>
														<div className="flex flex-col space-y-1">
															{availableRoles.map((role) => (
																<Button
																	key={role}
																	variant="ghost"
																	className="justify-start h-8 px-2 py-1 text-sm"
																	onClick={() => updateUser(u.id, { role: role as UserRole })}
																>
																	{getRoleLabel(role)} {getRoleLevel(role) > getRoleLevel(currentUserRole) ? "🔒" : ""}
																</Button>
															))}
														</div>
													</PopoverContent>
												</Popover>
											) : (
												<span className="text-sm font-medium">{getRoleLabel(u.role)}</span>
											)}
										</TableCell>
										<TableCell className="max-w-[500px]">
											<div className="flex flex-wrap gap-1">
												{availableAuthorities.map((authority) => {
													// Usar las authorities mergeadas (rol + authorities explícitas)
													const mergedAuthorities = mergeRoleAuthorities(u.role, u.authorities);
													const userHasAuthority = hasAuthority(mergedAuthorities, authority);
													const canAssign = canAssignAuthority(currentUserRole, authority);

													return (
														<Badge
															key={authority}
															variant={userHasAuthority ? "default" : "secondary"}
															className={`text-xs px-2 py-1 cursor-pointer transition-colors ${userHasAuthority
																? "bg-green-600 hover:bg-green-700 text-white"
																: "bg-gray-200 hover:bg-gray-300 text-gray-700"
																} ${!canAssign ? "opacity-50 cursor-not-allowed" : ""}`}
															onClick={() => canModify && canAssign && handleAuthorityChange(u.id, authority, !userHasAuthority)}
														>
															{authority.replace(/_/g, ' ')}
															{!canAssign && " 🔒"}
														</Badge>
													);
												})}
											</div>
										</TableCell>
										<TableCell>
											<Switch
												checked={u.isActive}
												onCheckedChange={(checked) => updateUser(u.id, { isActive: checked })}
												disabled={savingId === u.id || !canModify}
											/>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{canModify && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => invalidateUserSession(u.id)}
														disabled={savingId === u.id}
														className="h-8 w-8 p-0"
														title="Forzar logout del usuario"
													>
														<LogOut className="h-4 w-4" />
													</Button>
												)}
												{!canModify && (
													<span className="text-xs text-gray-500">Sin permisos</span>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</Card>

			{users.length === 0 && (
				<Card className="p-6">
					<div className="text-center text-gray-500">
						<div className="text-4xl mb-2">👥</div>
						<div className="text-lg font-medium">No hay usuarios</div>
						<div className="text-sm">Los usuarios aparecerán aquí cuando se registren</div>
					</div>
				</Card>
			)}
		</div>
	);
}
