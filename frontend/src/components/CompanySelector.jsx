import React, { useEffect, useState } from 'react';
import { useCompany } from './CompanyContext';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const CompanySelector = () => {
  const { company, setCompany } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, company: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const [form, setForm] = useState({ name: '', address: '', phone: '', fax: '' });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // const res = await axios.get('http://localhost:3000/api/companies');
      const res = await axios.get(`${API_BASE_URL}/api/companies`);
      setCompanies(res.data);
    } catch (err) {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Handlers ---
  const openNewDialog = () => { setForm({ name: '', address: '', phone: '', fax: '' }); setNewDialog(true); };
  const openEditDialog = (c) => { 
    setForm({ 
      name: c.company_name, 
      address: c.company_address,
      phone: c.phone_number || '',
      fax: c.fax_number || ''
    }); 
    setEditDialog({ open: true, company: c }); 
  };
  const openDeleteDialog = (c) => { setDeleteDialog({ open: true, company: c }); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/companies`, {
        company_name: form.name,
        company_address: form.address,
        phone_number: form.phone,
        fax_number: form.fax
      });
      await fetchCompanies();
      const created = res.data.company || (res.data.company_id && { 
        company_id: res.data.company_id, 
        company_name: form.name, 
        company_address: form.address,
        phone_number: form.phone,
        fax_number: form.fax
      });
      if (created) setCompany(created);
      setNewDialog(false);
      setForm({ name: '', address: '', phone: '', fax: '' });
    } catch (err) {} finally { setCreating(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditing(true);
    try {
      await axios.put(`${API_BASE_URL}/api/companies/${editDialog.company.company_id}`, {
        company_name: form.name,
        company_address: form.address,
        phone_number: form.phone,
        fax_number: form.fax
      });
      await fetchCompanies();
      if (company && company.company_id === editDialog.company.company_id) {
        setCompany({ 
          ...company, 
          company_name: form.name, 
          company_address: form.address,
          phone_number: form.phone,
          fax_number: form.fax
        });
      }
      setEditDialog({ open: false, company: null });
    } catch (err) {} finally { setEditing(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      console.log('Deleting company:', deleteDialog.company?.company_id);
      await axios.delete(`${API_BASE_URL}/api/companies/${deleteDialog.company.company_id}`);
      await fetchCompanies();
      if (company && company.company_id === deleteDialog.company.company_id) {
        setCompany(null);
      }
      setDeleteDialog({ open: false, company: null });
    } catch (err) {
      // Optionally show error
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 2 }}><CircularProgress size={24} /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <FormControl size="small" fullWidth sx={{ minWidth: 180 }}>
          <InputLabel>Company</InputLabel>
          <Select
            value={company?.company_id || ''}
            label="Company"
            onChange={e => {
              const selected = companies.find(c => c.company_id === e.target.value);
              if (selected) {
                setCompany({
                  company_id: selected.company_id,
                  company_name: selected.company_name,
                  company_address: selected.company_address,
                  phone_number: selected.phone_number || '',
                  fax_number: selected.fax_number || ''
                });
              }
            }}
            renderValue={selected => {
              const c = companies.find(c => c.company_id === selected);
              return c ? c.company_name : '';
            }}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 350, minWidth: 250 }
              },
            }}
          >
            {companies.map(c => (
              <MenuItem key={c.company_id} value={c.company_id}>{c.company_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setManageOpen(true)}>
          Manage Companies
        </Button>
      </Box>
      {/* Manage Companies Dialog */}
      <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Manage Companies</DialogTitle>
        <DialogContent>
          <List>
            {companies.map(c => (
              <ListItem key={c.company_id} secondaryAction={
                <>
                  <IconButton size="small" onClick={() => openEditDialog(c)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => openDeleteDialog(c)}><DeleteIcon fontSize="small" /></IconButton>
                </>
              }>
                <ListItemText 
                  primary={c.company_name} 
                  secondary={
                    <>
                      {c.company_address && <div>{c.company_address}</div>}
                      {c.phone_number && <div>Phone: {c.phone_number}</div>}
                      {c.fax_number && <div>Fax: {c.fax_number}</div>}
                    </>
                  } 
                />
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => { setNewDialog(true); }}
          >
            + Add New Company
          </Button>
        </DialogContent>
      </Dialog>
      {/* New Company Dialog */}
      <Dialog open={newDialog} onClose={() => setNewDialog(false)}>
        <DialogTitle>Add New Company</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent>
            <TextField
              label="Company Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Company Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Phone Number"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Fax Number"
              value={form.fax}
              onChange={e => setForm({ ...form, fax: e.target.value })}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewDialog(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Edit Company Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, company: null })}>
        <DialogTitle>Edit Company</DialogTitle>
        <form onSubmit={handleEdit}>
          <DialogContent>
            <TextField
              label="Company Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Company Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Phone Number"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Fax Number"
              value={form.fax}
              onChange={e => setForm({ ...form, fax: e.target.value })}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ open: false, company: null })} disabled={editing}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editing}>
              {editing ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Delete Company Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, company: null })}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            Are you sure you want to delete <b>{deleteDialog.company?.company_name}</b>? This action cannot be undone.
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, company: null })} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanySelector; 