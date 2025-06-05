// Configuración
const CONFIG = {
    GRAPHQL_ENDPOINT: 'https://parcial-back-72z4.onrender.com/graphql',
    HEADERS: {
        'Content-Type': 'application/json',
    }
};

// Módulo GraphQL
const GraphQLClient = {
    async query(query, variables = {}) {
        try {
            const response = await fetch(CONFIG.GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: CONFIG.HEADERS,
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data;
        } catch (error) {
            console.error('GraphQL Error:', error);
            throw error;
        }
    }
};

// Queries y Mutations
const QUERIES = {
    GET_PACIENTES: `
        query {
            getPacientes {
                id
                name
                email
            }
        }
    `,
    GET_PACIENTE_BY_ID: `
        query($id: ID!) {
            getPacienteById(id: $id) {
                id
                name
                email
            }
        }
    `,
    CREATE_PACIENTE: `
        mutation($input: PacienteInput!) {
            createPaciente(input: $input) {
                id
                name
                email
            }
        }
    `,
    UPDATE_PACIENTE: `
        mutation($id: ID!, $input: PacienteInput!) {
            updatePaciente(id: $id, input: $input) {
                id
                name
                email
            }
        }
    `,
    DELETE_PACIENTE: `
        mutation($id: ID!) {
            deletePaciente(id: $id)
        }
    `
};

// Módulo UI
const UI = {
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        const container = document.getElementById('notifications');
        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    },

    showLoading(button) {
        const originalText = button.textContent;
        button.innerHTML = '<span class="loading"></span>Procesando...';
        button.disabled = true;
        return originalText;
    },

    hideLoading(button, originalText) {
        button.textContent = originalText;
        button.disabled = false;
    },

    renderPaciente(paciente) {
        return `
            <div class="patient-card" data-id="${paciente.id}">
                <div class="patient-info">
                    <div class="patient-avatar">👤</div>
                    <div class="patient-details">
                        <h3>${paciente.name}</h3>
                        <p><strong>Email:</strong> ${paciente.email}</p>
                        <p><strong>ID:</strong> ${paciente.id}</p>
                    </div>
                    <div class="patient-actions">
                        <button class="btn-small btn-edit" onclick="App.editPaciente('${paciente.id}', '${paciente.name}', '${paciente.email}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-small btn-delete" onclick="App.confirmDelete('${paciente.id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderPacientesList(pacientes) {
        const container = document.getElementById('pacientesList');
        
        if (!pacientes || pacientes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <h3>No hay pacientes registrados</h3>
                    <p>Comienza creando tu primer paciente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pacientes.map(paciente => this.renderPaciente(paciente)).join('');
    },

    renderSinglePaciente(paciente) {
        const container = document.getElementById('searchResult');
        if (paciente) {
            container.innerHTML = `
                <div class="patient-card">
                    <div class="patient-info">
                        <div class="patient-avatar">👤</div>
                        <div class="patient-details">
                            <h3>${paciente.name}</h3>
                            <p><strong>Email:</strong> ${paciente.email}</p>
                            <p><strong>ID:</strong> ${paciente.id}</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '<p style="color: #e53e3e;">No se encontró ningún paciente con ese ID</p>';
        }
    },

    clearForm(formId) {
        document.getElementById(formId).reset();
    }
};

// Aplicación principal
const App = {
    async init() {
        this.setupEventListeners();
        await this.loadPacientes();
    },

    setupEventListeners() {
        // Crear paciente
        document.getElementById('createForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createPaciente();
        });

        // Buscar paciente
        document.getElementById('searchForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.searchPaciente();
        });

        // Actualizar paciente
        document.getElementById('updateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updatePaciente();
        });

        // Eliminar paciente
        document.getElementById('deleteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.deletePaciente();
        });

        // Refrescar lista
        document.getElementById('refreshBtn').addEventListener('click', async () => {
            await this.loadPacientes();
        });
    },

    async loadPacientes() {
        try {
            const data = await GraphQLClient.query(QUERIES.GET_PACIENTES);
            UI.renderPacientesList(data.getPacientes);
        } catch (error) {
            UI.showNotification('Error al cargar pacientes: ' + error.message, 'error');
        }
    },

    async createPaciente() {
        const button = document.querySelector('#createForm button');
        const originalText = UI.showLoading(button);

        try {
            const name = document.getElementById('createName').value;
            const email = document.getElementById('createEmail').value;

            const data = await GraphQLClient.query(QUERIES.CREATE_PACIENTE, {
                input: { name, email }
            });

            UI.showNotification('Paciente creado exitosamente', 'success');
            UI.clearForm('createForm');
            await this.loadPacientes();
        } catch (error) {
            UI.showNotification('Error al crear paciente: ' + error.message, 'error');
        } finally {
            UI.hideLoading(button, originalText);
        }
    },

    async searchPaciente() {
        const button = document.querySelector('#searchForm button');
        const originalText = UI.showLoading(button);

        try {
            const id = document.getElementById('searchId').value;
            const data = await GraphQLClient.query(QUERIES.GET_PACIENTE_BY_ID, { id });
            UI.renderSinglePaciente(data.getPacienteById);
        } catch (error) {
            UI.showNotification('Error al buscar paciente: ' + error.message, 'error');
            UI.renderSinglePaciente(null);
        } finally {
            UI.hideLoading(button, originalText);
        }
    },

    async updatePaciente() {
        const button = document.querySelector('#updateForm button');
        const originalText = UI.showLoading(button);

        try {
            const id = document.getElementById('updateId').value;
            const name = document.getElementById('updateName').value;
            const email = document.getElementById('updateEmail').value;

            const data = await GraphQLClient.query(QUERIES.UPDATE_PACIENTE, {
                id,
                input: { name, email }
            });

            UI.showNotification('Paciente actualizado exitosamente', 'success');
            UI.clearForm('updateForm');
            await this.loadPacientes();
        } catch (error) {
            UI.showNotification('Error al actualizar paciente: ' + error.message, 'error');
        } finally {
            UI.hideLoading(button, originalText);
        }
    },

    async deletePaciente() {
        const button = document.querySelector('#deleteForm button');
        const originalText = UI.showLoading(button);

        try {
            const id = document.getElementById('deleteId').value;
            
            if (!confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
                return;
            }

            const data = await GraphQLClient.query(QUERIES.DELETE_PACIENTE, { id });

            if (data.deletePaciente) {
                UI.showNotification('Paciente eliminado exitosamente', 'success');
                UI.clearForm('deleteForm');
                await this.loadPacientes();
            } else {
                UI.showNotification('No se pudo eliminar el paciente', 'error');
            }
        } catch (error) {
            UI.showNotification('Error al eliminar paciente: ' + error.message, 'error');
        } finally {
            UI.hideLoading(button, originalText);
        }
    },

    editPaciente(id, name, email) {
        document.getElementById('updateId').value = id;
        document.getElementById('updateName').value = name;
        document.getElementById('updateEmail').value = email;
        document.getElementById('updateForm').scrollIntoView({ behavior: 'smooth' });
    },

    async confirmDelete(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
            try {
                const data = await GraphQLClient.query(QUERIES.DELETE_PACIENTE, { id });
                
                if (data.deletePaciente) {
                    UI.showNotification('Paciente eliminado exitosamente', 'success');
                    await this.loadPacientes();
                } else {
                    UI.showNotification('No se pudo eliminar el paciente', 'error');
                }
            } catch (error) {
                UI.showNotification('Error al eliminar paciente: ' + error.message, 'error');
            }
        }
    }
};

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});