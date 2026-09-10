type UserRole = 'Shipping Office' | 'Buyer Agent' | 'Supervisor' | 'Seller' | 'Receive Agent';

type StateId =
  | 'REQUISITION_PREPARED'
  | 'RFQ_PENDING_SUPERVISOR'
  | 'SELLER_REVIEWING_RFQ'
  | 'QUOTE_UNDER_REVIEW'
  | 'ORDER_PREPARED'
  | 'ORDER_UNDER_SELLER_REVIEW'
  | 'FULFILLED'
  | 'PRODUCT_RECEIVED_AGENT'
  | 'INVOICED'
  | 'PAYMENT_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

interface FlowState {
  id: StateId;
  label: string;
  assignedRole: UserRole;
  stepNumber: number;
}

interface OrderItem {
  id: string;
  product: string;
  quantity: number;
  budget: number;
  requiresReview: boolean;
  currentStateId: StateId;
  quotedPrice?: number;
  paymentDone: boolean;
}

const FLOW_STATES: FlowState[] = [
  { id: 'REQUISITION_PREPARED', label: 'Prepare Requisition', assignedRole: 'Buyer Agent', stepNumber: 1 },
  { id: 'RFQ_PENDING_SUPERVISOR', label: 'Supervisor Evaluation', assignedRole: 'Supervisor', stepNumber: 2 },
  { id: 'SELLER_REVIEWING_RFQ', label: 'Review Quotation Request', assignedRole: 'Seller', stepNumber: 2 },
  { id: 'QUOTE_UNDER_REVIEW', label: 'Actual Quote Review', assignedRole: 'Buyer Agent', stepNumber: 3 },
  { id: 'ORDER_PREPARED', label: 'Order Preparation', assignedRole: 'Buyer Agent', stepNumber: 4 },
  { id: 'ORDER_UNDER_SELLER_REVIEW', label: 'Order Review', assignedRole: 'Seller', stepNumber: 4 },
  { id: 'FULFILLED', label: 'Fulfill Order', assignedRole: 'Seller', stepNumber: 5 },
  { id: 'PRODUCT_RECEIVED_AGENT', label: 'Receive Product', assignedRole: 'Receive Agent', stepNumber: 5 },
  { id: 'INVOICED', label: 'Prepare Order Invoice', assignedRole: 'Seller', stepNumber: 6 },
  { id: 'PAYMENT_RECEIVED', label: 'Receive Payment', assignedRole: 'Seller', stepNumber: 6 },
  { id: 'COMPLETED', label: 'Completed Deliverable', assignedRole: 'Receive Agent', stepNumber: 7 },
  { id: 'CANCELLED', label: 'Order Cancelled', assignedRole: 'Shipping Office', stepNumber: 0 }
];

const STATES_MAP = new Map<StateId, FlowState>(
  FLOW_STATES.map(state => [state.id, state])
);

class OrderAppManager {
  private orderList: OrderItem[] = [];
  private activeRole: UserRole = 'Shipping Office';
  private selectedOrderId: string | null = null;

  constructor() {
    this.seedInitialData();
    this.bindEvents();
    this.render();
  }

  private seedInitialData(): void {
    this.orderList = [
      {
        id: 'ORD-2001',
        product: 'Xiaomi A24i Monitors',
        quantity: 12,
        budget: 2400,
        requiresReview: true,
        currentStateId: 'REQUISITION_PREPARED',
        paymentDone: false
      },
      {
        id: 'ORD-2002',
        product: 'Adidas Agravic Trail Shoes',
        quantity: 30,
        budget: 4500,
        requiresReview: false,
        currentStateId: 'SELLER_REVIEWING_RFQ',
        paymentDone: false
      }
    ];
    this.selectedOrderId = this.orderList[0].id;
  }

  private bindEvents(): void {
    const roleSelect = document.getElementById('select-role') as HTMLSelectElement | null;
    roleSelect?.addEventListener('change', (e: Event) => {
      this.activeRole = (e.target as HTMLSelectElement).value as UserRole;
      this.render();
    });

    const formReq = document.getElementById('form-requisition') as HTMLFormElement | null;
    formReq?.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this.addRequisition();
    });
  }

  private addRequisition(): void {
    const inputProduct = document.getElementById('input-product') as HTMLInputElement;
    const inputQuantity = document.getElementById('input-quantity') as HTMLInputElement;
    const inputBudget = document.getElementById('input-budget') as HTMLInputElement;
    const inputReview = document.getElementById('input-review') as HTMLInputElement;

    const newOrder: OrderItem = {
      id: `ORD-${Math.floor(2000 + Math.random() * 8000)}`,
      product: inputProduct.value,
      quantity: parseInt(inputQuantity.value, 10),
      budget: parseFloat(inputBudget.value),
      requiresReview: inputReview.checked,
      currentStateId: 'REQUISITION_PREPARED',
      paymentDone: false
    };

    this.orderList.unshift(newOrder);
    this.selectedOrderId = newOrder.id;
    (document.getElementById('form-requisition') as HTMLFormElement).reset();
    this.render();
  }

  public transitionState(orderId: string, nextState: StateId, payload?: { price?: number; paid?: boolean }): void {
    const order = this.orderList.find(o => o.id === orderId);
    if (!order) return;

    order.currentStateId = nextState;
    if (payload?.price !== undefined) order.quotedPrice = payload.price;
    if (payload?.paid !== undefined) order.paymentDone = payload.paid;

    this.render();
  }

  private render(): void {
    const tbody = document.getElementById('order-list-body') as HTMLTableSectionElement | null;
    const counter = document.getElementById('order-counter') as HTMLElement | null;
    if (!tbody) return;

    tbody.innerHTML = '';
    if (counter) counter.textContent = `${this.orderList.length} Orders`;

    this.orderList.forEach(order => {
      const stateInfo = STATES_MAP.get(order.currentStateId);
      const isMyTurn = stateInfo?.assignedRole === this.activeRole;

      const tr = document.createElement('tr');
      if (order.id === this.selectedOrderId) {
        tr.style.backgroundColor = '#f1f5f9';
      }

      tr.innerHTML = `
        <td><strong>${order.id}</strong></td>
        <td>${order.product}</td>
        <td>${order.quantity}</td>
        <td><span class="badge">${stateInfo ? stateInfo.label : order.currentStateId}</span></td>
        <td><span class="badge" style="background:${isMyTurn ? '#dcfce7' : '#e2e8f0'}; color:${isMyTurn ? '#15803d' : '#475569'}">${stateInfo ? stateInfo.assignedRole : 'N/A'}</span></td>
        <td></td>
      `;

      const actionTd = tr.querySelector('td:last-child') as HTMLTableCellElement;
      const btn = document.createElement('button');
      btn.className = `btn ${isMyTurn ? 'btn-primary' : 'btn-secondary'}`;
      btn.textContent = isMyTurn ? 'Process Order' : 'View Order';
      btn.addEventListener('click', () => {
        this.selectedOrderId = order.id;
        this.render();
      });

      actionTd.appendChild(btn);
      tbody.appendChild(tr);
    });

    this.renderDetails();
  }

  private renderDetails(): void {
    const panel = document.getElementById('panel-detail') as HTMLElement | null;
    if (!panel) return;

    if (!this.selectedOrderId) {
      panel.classList.add('hidden');
      return;
    }

    const order = this.orderList.find(o => o.id === this.selectedOrderId);
    if (!order) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');

    const stateInfo = STATES_MAP.get(order.currentStateId);
    const currentStepNum = stateInfo ? stateInfo.stepNumber : 0;

    (document.getElementById('detail-id') as HTMLElement).textContent = `#${order.id}`;
    (document.getElementById('detail-status') as HTMLElement).textContent = stateInfo ? stateInfo.label : order.currentStateId;
    (document.getElementById('detail-product') as HTMLElement).textContent = order.product;
    (document.getElementById('detail-quantity') as HTMLElement).textContent = order.quantity.toString();
    (document.getElementById('detail-quote') as HTMLElement).textContent = order.quotedPrice ? `$${order.quotedPrice}` : 'Pending';
    (document.getElementById('detail-payment') as HTMLElement).textContent = order.paymentDone ? 'Completed' : 'Pending';

    const steps = document.querySelectorAll('.stepper .step');
    steps.forEach(stepEl => {
      const stepVal = parseInt(stepEl.getAttribute('data-step') || '0', 10);
      stepEl.classList.remove('active', 'completed');
      if (stepVal < currentStepNum) stepEl.classList.add('completed');
      if (stepVal === currentStepNum) stepEl.classList.add('active');
    });

    const btnContainer = document.getElementById('container-buttons') as HTMLElement;
    const inputContainer = document.getElementById('container-inputs') as HTMLElement;
    const noticeBanner = document.getElementById('role-notice') as HTMLElement;
    
    btnContainer.innerHTML = '';
    inputContainer.innerHTML = '';

    if (stateInfo && stateInfo.assignedRole !== this.activeRole) {
      noticeBanner.className = 'notice-banner locked-turn';
      noticeBanner.textContent = `Action required by role: ${stateInfo.assignedRole}. Switch Workspace Role above to operate.`;
      return;
    }

    noticeBanner.className = 'notice-banner active-turn';
    noticeBanner.textContent = `Active Role matched (${this.activeRole}). Select action below to advance state:`;

    switch (order.currentStateId) {
      case 'REQUISITION_PREPARED':
        this.addButton(btnContainer, 'Send Request for Quote (RFQ)', 'btn-primary', () => {
          const next = order.requiresReview ? 'RFQ_PENDING_SUPERVISOR' : 'SELLER_REVIEWING_RFQ';
          this.transitionState(order.id, next);
        });
        break;

      case 'RFQ_PENDING_SUPERVISOR':
        this.addButton(btnContainer, 'Approve RFQ', 'btn-success', () => {
          this.transitionState(order.id, 'SELLER_REVIEWING_RFQ');
        });
        this.addButton(btnContainer, 'Reject RFQ', 'btn-danger', () => {
          this.transitionState(order.id, 'REQUISITION_PREPARED');
        });
        break;

      case 'SELLER_REVIEWING_RFQ':
        inputContainer.innerHTML = `
          <div class="field">
            <label for="input-price-val">Quoted Amount ($):</label>
            <input type="number" id="input-price-val" value="${order.budget * 0.95}">
          </div>
        `;
        this.addButton(btnContainer, 'Submit Quote', 'btn-primary', () => {
          const input = document.getElementById('input-price-val') as HTMLInputElement;
          const val = parseFloat(input.value) || order.budget;
          this.transitionState(order.id, 'QUOTE_UNDER_REVIEW', { price: val });
        });
        this.addButton(btnContainer, 'Decline Quote Request', 'btn-danger', () => {
          this.transitionState(order.id, 'CANCELLED');
        });
        break;

      case 'QUOTE_UNDER_REVIEW':
        this.addButton(btnContainer, 'Accept Quote and Prepare Order', 'btn-success', () => {
          this.transitionState(order.id, 'ORDER_PREPARED');
        });
        this.addButton(btnContainer, 'Reject Quote', 'btn-danger', () => {
          this.transitionState(order.id, 'REQUISITION_PREPARED');
        });
        break;

      case 'ORDER_PREPARED':
        this.addButton(btnContainer, 'Send Order to Seller', 'btn-primary', () => {
          this.transitionState(order.id, 'ORDER_UNDER_SELLER_REVIEW');
        });
        break;

      case 'ORDER_UNDER_SELLER_REVIEW':
        this.addButton(btnContainer, 'Accept Order Request', 'btn-success', () => {
          this.transitionState(order.id, 'FULFILLED');
        });
        break;

      case 'FULFILLED':
        this.addButton(btnContainer, 'Fulfill and Dispatch Product', 'btn-primary', () => {
          this.transitionState(order.id, 'PRODUCT_RECEIVED_AGENT');
        });
        break;

      case 'PRODUCT_RECEIVED_AGENT':
        this.addButton(btnContainer, 'Generate Order Invoice', 'btn-primary', () => {
          this.transitionState(order.id, 'INVOICED');
        });
        break;

      case 'INVOICED':
        this.addButton(btnContainer, 'Record Customer Payment', 'btn-success', () => {
          this.transitionState(order.id, 'PAYMENT_RECEIVED', { paid: true });
        });
        break;

      case 'PAYMENT_RECEIVED':
        this.addButton(btnContainer, 'Close Order Lifecycle', 'btn-primary', () => {
          this.transitionState(order.id, 'COMPLETED');
        });
        break;
    }
  }

  private addButton(container: HTMLElement, label: string, cssClass: string, onClick: () => void): void {
    const btn = document.createElement('button');
    btn.className = `btn ${cssClass}`;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    container.appendChild(btn);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OrderAppManager();
});