# Services Management System Documentation

## Overview

The Services Management System is a comprehensive platform for managing Society Tieups, Corporate Tieups, Debris Removal, and Demolition Services. It includes professional dashboard interfaces, workflow management, certificate generation, and complete auditing capabilities.

## System Architecture

### Backend Components (Django Models)

Located in `server/services/models.py`:

1. **Organization** - Represents societies, corporates, institutions, or malls
   - Fields: organization_id, name, type, contact details, address, verification status
   - Status: pending_verification, active, inactive, suspended
   - Dashboard metrics cached for performance

2. **ServiceType** - Defines service categories
   - society_tieup, corporate_tieup, debris_removal, demolition_removal
   - Associated with images and pricing

3. **ServiceOrder** - Individual service orders with complete lifecycle
   - Status Flow: pending_collection → collection_scheduled → in_progress → material_processing → completed
   - Tracks quantities, values, environmental impact
   - Supports items list, special instructions, audit trails

4. **ServiceOrderAudit** - Immutable audit trail for all order changes
   - Records status changes, quantity updates, notes
   - Performed by tracking
   - Timestamps for every change

5. **Certificate** - Professional certificate generation
   - Types: completion, environmental_impact, quantity_confirmation
   - Font customization: family, heading size, body size
   - Approval workflow
   - PDF export capability

6. **OrganizationDashboard** - Cached metrics
   - Order counts and statuses
   - Processing metrics (quantity, value)
   - Environmental impact tracking
   - Certificate statistics

### Frontend Components (React/TypeScript)

Located in `admin-dashboard/src/components/dashboard/services/`:

#### 1. **ServiceCard.tsx**
Large card UI displaying each service with:
- Service image from assets (societyTieup.webp, corporateTieup.webp, debris_removal.webp)
- 4 tabs: Overview, Audits, Orders, Environmental Impact
- Organization counts
- Interactive tabs for deep dives

#### 2. **OrganizationDetail.tsx**
Detailed organization view modal featuring:
- Contact and address information
- 4 tabs: Metrics, Environmental, Certificates, Audit Trail
- Dashboard metrics (orders, quantity, value processed)
- Environmental achievement statistics
- Recent orders list
- Completion rates and trends

#### 3. **OrderWorkflow.tsx**
Complete order lifecycle management:
- Visual workflow diagram showing 5 statuses
- Filter by organization and status
- Status transition dialog with notes
- Quantity update capability
- Batch action support (export, notes, status changes)

#### 4. **CertificateGenerator.tsx**
Professional certificate creation:
- 3 certificate types with descriptions
- Font configuration panel:
  - 9 font families (Cambria, Georgia, Arial, Helvetica, etc.)
  - Heading size: 20-40px
  - Body size: 10-20px
  - Live preview
- Order selection from completed orders
- Certificate preview modal
- PDF export capability
- Approval workflow

#### 5. **AuditDashboard.tsx**
System audit and compliance reporting:
- 4 compliance metrics (On-Time Completions, Quantity Accuracy, etc.)
- 4 tabs: Overview, Order Audits, Certificate Audit, Compliance
- Charts:
  - Bar charts for order trends
  - Line charts for status timeline
  - Pie charts for certificate status distribution
- Recent activity log (10 items)
- Compliance percentage tracking

#### 6. **ServicesPage (page.tsx)**
Main orchestrator component:
- Header with description
- 4 key statistic cards
- 4 main tabs:
  1. **Overview** - ServiceCard grid (2x2) for all service types
  2. **Organizations** - Searchable organization list with nested tabs for filtering
  3. **Orders & Workflows** - Full OrderWorkflow component
  4. **Certificates** - Full CertificateGenerator component

## Frontend Setup Instructions

### 1. Ensure Dependencies

```bash
npm install recharts  # For charts/graphs
```

### 2. Access the Services Page

Navigate to `/dashboard/services` in the admin dashboard.

### 3. Component Integration

All components automatically integrate with the mock API layer:

```typescript
import ServiceManagementAPI from '@/services/services';

// Load organizations
const orgs = await ServiceManagementAPI.getOrganizations();

// Update order status
await ServiceManagementAPI.updateServiceOrderStatus(orderId, newStatus, notes);

// Generate certificate
const cert = await ServiceManagementAPI.generateCertificate(
  orderId, 
  certificateType, 
  certificateData
);
```

## Backend API Integration

### Django Setup

1. **Run Migrations** (when connected to backend):
```bash
python manage.py makemigrations services
python manage.py migrate
```

2. **Create Serializers** in `server/services/serializers.py`:
```python
from rest_framework import serializers
from .models import Organization, ServiceType, ServiceOrder, Certificate

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

# ... (other serializers)
```

3. **Create ViewSets** in `server/services/views.py`:
```python
from rest_framework import viewsets
from .models import Organization, ServiceOrder
from .serializers import OrganizationSerializer, ServiceOrderSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

class ServiceOrderViewSet(viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.all()
    serializer_class = ServiceOrderSerializer
```

4. **Register URLs** in `server/services/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, ServiceOrderViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'orders', ServiceOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

5. **Update Main URLs** in `server/server/urls.py`:
```python
urlpatterns = [
    # ... other patterns
    path('api/services/', include('services.urls')),
]
```

### API Endpoints

```
GET    /api/services/organizations/           - List all organizations
POST   /api/services/organizations/           - Create new organization
GET    /api/services/organizations/{id}/      - Get organization details
PUT    /api/services/organizations/{id}/      - Update organization
DELETE /api/services/organizations/{id}/      - Delete organization

GET    /api/services/orders/                  - List all orders
POST   /api/services/orders/                  - Create new order
GET    /api/services/orders/{id}/             - Get order details
PATCH  /api/services/orders/{id}/update-status/ - Change order status
PATCH  /api/services/orders/{id}/update-quantity/ - Update quantity

GET    /api/services/orders/{id}/audit-logs/  - Get order audit trail

GET    /api/services/certificates/           - List certificates
POST   /api/services/certificates/           - Generate certificate
GET    /api/services/certificates/{id}/      - Get certificate details
PATCH  /api/services/certificates/{id}/approve/ - Approve certificate
```

## Data Flow

### Order Processing Workflow

1. **Order Creation**
   - Organization requests collection
   - Order created in `pending_collection` status
   - ServiceOrderAudit entry created

2. **Collection Scheduling**
   - Admin reviews request
   - Schedules collection date
   - Status → `collection_scheduled`

3. **Collection Execution**
   - Collection team collects materials
   - Status → `in_progress`
   - Initial quantity recorded

4. **Material Processing**
   - Materials processed and categorized
   - Status → `material_processing`
   - Final quantity recorded (may differ from estimate)

5. **Completion**
   - Processing complete
   - Status → `completed`
   - Final value calculated
   - Environmental impact calculated

6. **Certificate Generation**
   - Admin generates certificate with custom fonts
   - Certificate reviewed and approved
   - PDF generated and stored

### Environmental Impact Calculation

For each order, calculated based on:
```python
{
    'trees_saved': quantity * trees_per_unit,
    'co2_reduced': quantity * co2_per_unit,
    'water_saved': quantity * water_per_unit,
    'energy_saved': quantity * energy_per_unit,
}
```

Aggregated per organization and displayed on dashboards.

## Font Customization for Certificates

### Available Fonts (with Analysis)

**Serif Fonts** (Traditional, professional certificates):
- Cambria: Classic, elegant, government documents
- Georgia: Readable, web-safe, professional
- Times New Roman: Traditional, formal
- Garamond: Sophisticated, luxury
- Palatino: Warm, personal

**Sans-Serif Fonts** (Modern, clean):
- Arial: Universal, neutral, corporate
- Helvetica: Minimalist, contemporary
- Verdana: Screen-optimized, modern
- Calibri: Office standard, clean

### Font Sizing Best Practices

- **Heading Font Size**: 24-32px
  - 28px default (balanced, professional)
  - Larger: Emphasis, importance
  - Smaller: Subtle, secondary focus

- **Body Font Size**: 12-16px
  - 14px default (readable, standard)
  - Affects certificate length and readability

### Certificate Styling Pipeline

1. **Configuration** (FontSettings tab)
   - Select font family
   - Set heading size (20-40px)
   - Set body size (10-20px)
   - Live preview updates

2. **Preview** (Preview dialog)
   - Full certificate layout shown
   - Font applied in real-time
   - Organization name, order details displayed
   - Environmental impact section (if applicable)

3. **Generation**
   - Certificate HTML created with specified fonts
   - PDF generated with embedded fonts
   - Stored in database with font metadata

4. **Approval**
   - Admin reviews certificate
   - Approves or requests changes
   - Can regenerate with different fonts

## Audit Compliance

### What Gets Audited

1. **Organization Changes**
   - Creation, verification, status updates
   - Contact information modifications
   - Member count changes

2. **Order Lifecycle**
   - Every status change with timestamp
   - Quantity updates with reason
   - Final value calculations
   - Special instructions modifications

3. **Certificate Operations**
   - Generation (type, order, data)
   - Approval/rejection
   - Font customization
   - PDF export

4. **System-Wide**
   - User actions (who, when, what)
   - System calculations
   - Batch operations
   - Data integrity checks

### Compliance Metrics

Tracked and displayed:
- **On-Time Completions**: Orders completed by scheduled date (%)
- **Quantity Accuracy**: Final vs estimated variance (%)
- **Certificate Approval Rate**: Approved/total certificates (%)
- **Data Integrity**: Audit trail completeness (%)

## Testing Mock Data

The system includes comprehensive mock data:

**Organizations**:
- Green Valley Society (500 members, active)
- TechCorp Industries (2000 members, active)

**Orders**:
- Mix of statuses: pending_collection, in_progress, completed
- Varying quantities and values
- Environmental impact data

**Certificates**:
- Multiple types
- Different approval states
- Font variations

Access via `/dashboard/services` to explore all functionality without backend connection.

## Switching to Live Backend

### Update API Base URL

In `admin-dashboard/src/services/services.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
```

Set environment variable:
```bash
NEXT_PUBLIC_API_URL=http://backend-server/api
```

### Enable Real API Calls

Comment out mock data returns and uncomment API calls:

```typescript
// OLD (Mock)
return MOCK_ORGANIZATIONS;

// NEW (API)
return api.get('/organizations/');
```

### Authentication

Ensure Bearer token is included in API requests:

```typescript
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Features Summary

### For Admin Users

1. ✓ View all organizations with status and verification
2. ✓ Monitor all service orders in real-time
3. ✓ Update order statuses with audit trail
4. ✓ Modify quantities with reason tracking
5. ✓ Generate professional certificates with custom fonts
6. ✓ Approve/reject certificates
7. ✓ View organization-specific dashboards
8. ✓ Track environmental impact metrics
9. ✓ Complete audit trails for compliance
10. ✓ Export order details and certificates

### For Reporting

1. ✓ Order processing trends (charts, time series)
2. ✓ Certificate status distribution
3. ✓ Organization performance metrics
4. ✓ Environmental impact summary
5. ✓ Compliance status and metrics
6. ✓ Audit logs searchable by type, date, actor

## Performance Optimization

1. **Dashboard Caching**: `OrganizationDashboard` model stores pre-calculated metrics
2. **Lazy Loading**: Components load data on-demand
3. **Pagination**: List views support pagination for large datasets
4. **Indexing**: Database indexes on frequently queried fields (organization_type, status, created_at)

## Security Considerations

1. **Audit Trail**: Immutable `ServiceOrderAudit` for compliance
2. **Verification Status**: Organizations must be verified before creating orders
3. **Role-Based Access**: Different permissions for admin, agent, organization
4. **Quantity Tracking**: All quantity changes logged with reason
5. **Certificate Approval**: Two-step process (generate → approve)

## Future Enhancements

1. **Email Notifications**: Send certificates and updates via email
2. **PDF Watermarking**: Add security watermarks to certificates
3. **Batch Operations**: Process multiple orders simultaneously
4. **Advanced Analytics**: ML-based predictive analytics
5. **Mobile App**: Mobile interface for collection agents
6. **Integration**: Third-party service provider APIs
7. **Multi-language**: Support for multiple languages in certificates
