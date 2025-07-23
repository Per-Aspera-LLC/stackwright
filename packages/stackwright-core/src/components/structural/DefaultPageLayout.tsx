import { Stack, Box } from '@mui/material';
import { PageContent } from '../../types/content';
import { renderContent } from '../../utils/contentRenderer';

// This is now a simple wrapper - consider deprecating in favor of PageLayout
export default function DefaultPageLayout(pageContent: PageContent) {
    return (
        <main>
          <Box sx={{ flexGrow: 1 }}>
            <Stack spacing={3}>  
              {/* Remove TopAppBar and BottomAppBar from here since PageLayout handles them */}
              <Box>
                {renderContent(pageContent)}
              </Box>
            </Stack>
          </Box>
        </main>
    );
}